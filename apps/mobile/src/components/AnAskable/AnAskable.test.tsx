import { Alert } from 'react-native';
import { fireEvent, render, userEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { askForMedia, removeMediaRequest } from '@ValenceClient/requests/fetchMediaRequests';
import { fetchSession } from '@ValenceClient/session/auth';
import { aCatalogueTitleDetail } from '@ValenceClient/testing/aCatalogueTitleDetail';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { aRequestItem } from '@ValenceClient/testing/aRequestItem';
import { askLinkedServer } from '@ValenceClient/linking/askLinkedServer';
import { aLinkedServerFace } from '@ValenceClient/testing/aLinkedServerFace';
import type { LinkedServerFace } from '@ValenceContracts/schemas/LinkSharing';
import { AnAskable } from './AnAskable';
import type { ReactNode } from 'react';
import type {
  CatalogueStanding,
  CatalogueTitleDetail,
} from '@ValenceContracts/schemas/CatalogueTitle';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { ProfilesOnOffer } from '@ValenceContracts/schemas/QualityProfile';
import { theAddressOf } from '@ValenceMobile/testing/theAddressOf';

jest.mock('@ValenceClient/requests/fetchMediaRequests', () => ({
  ...jest.requireActual<object>('@ValenceClient/requests/fetchMediaRequests'),
  askForMedia: jest.fn(),
  removeMediaRequest: jest.fn(),
}));

jest.mock('@ValenceClient/linking/askLinkedServer', () => ({
  askLinkedServer: jest.fn(),
}));

jest.mock('@ValenceClient/session/auth', () => ({
  ...jest.requireActual<object>('@ValenceClient/session/auth'),
  fetchSession: jest.fn(),
}));

const REQUEST_ID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

const QUALITY_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

const around = (children: ReactNode) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

/**
 * Dune as its page reads it, standing wherever the test says.
 */
const theDetail = (standing: CatalogueStanding): CatalogueTitleDetail =>
  aCatalogueTitleDetail({ standing });

/**
 * Answers every question the page asks.
 */
const answering = ({
  standing = { status: 'askable', mediaId: null, requestId: null, requestState: null },
  requests = [],
  offered = { choices: [], forcedId: null },
  faces = [],
  kinds = ['film', 'series', 'artist', 'album', 'book'],
}: {
  standing?: CatalogueStanding;
  requests?: MediaRequest[];
  offered?: ProfilesOnOffer;
  faces?: LinkedServerFace[];
  kinds?: string[];
}) => {
  globalThis.fetch = jest.fn((input: RequestInfo | URL) =>
    Promise.resolve(
      theAddressOf(input).includes('/catalogue/title/')
        ? Response.json(theDetail(standing))
        : theAddressOf(input).includes('/api/requests/profiles')
          ? Response.json(offered)
          : theAddressOf(input).endsWith('/api/requests/media')
            ? Response.json(requests)
            : theAddressOf(input).endsWith('/api/requests/availability')
              ? Response.json({ isEnabled: true, kinds })
              : theAddressOf(input).endsWith('/seasons')
                ? Response.json([
                    { season: 1, episodeCount: 9, firstAired: '2022-02-18', standing: 'requested' },
                    { season: 2, episodeCount: 10, firstAired: '2025-01-17', standing: 'askable' },
                  ])
                : theAddressOf(input).endsWith('/api/linked-servers/faces')
                  ? Response.json({ servers: faces })
                  : Response.json([]),
    ),
  );
};

const drawIt = async (onOpen = jest.fn()) =>
  render(around(<AnAskable kind="film" id="438631" onOpen={onOpen} onBack={jest.fn()} />));

beforeEach(() => {
  jest.mocked(askForMedia).mockReset().mockResolvedValue({ value: null, refusal: null });
  jest.mocked(removeMediaRequest).mockReset().mockResolvedValue(null);
  jest
    .mocked(askLinkedServer)
    .mockReset()
    .mockResolvedValue({ value: { title: 'Dune', isNew: true }, refusal: null });
  jest.mocked(fetchSession).mockReset().mockResolvedValue({
    id: 'someone',
    name: 'Sam',
    email: 'sam@valence.local',
    emailVerified: true,
  });
});

describe('AnAskable', () => {
  it('says what it is', async () => {
    answering({});

    const drawn = await drawIt();

    expect(await drawn.findByText('2021 · 2 h 35 min · Science Fiction')).toBeTruthy();
  });

  it('asks for a film by its catalogue id', async () => {
    answering({});

    const drawn = await drawIt();

    await userEvent.press(await drawn.findByRole('button', { name: 'Request' }));

    expect(askForMedia).toHaveBeenCalledWith({ kind: 'film', tmdbId: 438631 });
  });

  it('asks which quality where the server offers a choice', async () => {
    answering({
      offered: {
        choices: [
          { id: QUALITY_ID, name: '4K', kind: 'video' },
          { id: '3fa85f64-5717-4562-b3fc-2c963f66afa7', name: 'HD', kind: 'video' },
        ],
        forcedId: null,
      },
    });

    const drawn = await drawIt();

    await waitFor(() => {
      expect(drawn.getByRole('button', { name: '4K' })).toBeTruthy();
    });
    expect(drawn.getByRole('button', { name: 'Request', disabled: true })).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: '4K' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Request' }));

    expect(askForMedia).toHaveBeenCalledWith({
      kind: 'film',
      tmdbId: 438631,
      profileId: QUALITY_ID,
    });
  });

  it('says why the server would not take it', async () => {
    answering({});
    jest
      .mocked(askForMedia)
      .mockResolvedValue({ value: null, refusal: { message: 'You have asked for enough.' } });

    const drawn = await drawIt();

    await userEvent.press(await drawn.findByRole('button', { name: 'Request' }));

    expect(await drawn.findByText('You have asked for enough.')).toBeTruthy();
  });

  it('opens it in the library at once, rather than asking about it', async () => {
    answering({
      standing: { status: 'library', mediaId: 'm-1', requestId: null, requestState: null },
    });

    const onOpen = jest.fn();
    const drawn = await drawIt(onOpen);

    await waitFor(() => {
      expect(onOpen).toHaveBeenCalledWith('film', 'm-1');
    });
    expect(drawn.queryByRole('button', { name: 'Open' })).toBeNull();
    expect(drawn.queryByRole('button', { name: 'Request' })).toBeNull();
  });

  it('offers the seasons of a programme the library holds some of, where more is asked for', async () => {
    answering({
      standing: { status: 'library', mediaId: 'm-1', requestId: null, requestState: null },
    });

    const onOpen = jest.fn();
    const drawn = await render(
      around(<AnAskable kind="series" id="438631" isMore onOpen={onOpen} onBack={jest.fn()} />),
    );

    await userEvent.press(await drawn.findByRole('button', { name: 'Request' }));

    expect(onOpen).not.toHaveBeenCalled();
    expect(askForMedia).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'series', tmdbId: 438631 }),
    );
  });

  it('lets somebody take back their own request, once they have said so', async () => {
    const alert = jest.spyOn(Alert, 'alert');

    answering({
      standing: {
        status: 'requested',
        mediaId: null,
        requestId: REQUEST_ID,
        requestState: 'wanted',
      },
      requests: [aMediaRequest({ id: REQUEST_ID })],
    });

    const drawn = await drawIt();

    await userEvent.press(await drawn.findByRole('button', { name: 'Cancel request' }));

    expect(removeMediaRequest).not.toHaveBeenCalled();

    const buttons = alert.mock.calls[0]?.[2] ?? [];

    buttons.find((button) => button.text === 'Cancel request')?.onPress?.();

    expect(removeMediaRequest).toHaveBeenCalledWith(REQUEST_ID, true);
  });

  it('offers no request where no library takes films, and says so', async () => {
    answering({ kinds: ['series'] });

    const drawn = await drawIt();

    expect(await drawn.findByText(/No library on this server takes requests/)).toBeTruthy();
    expect(drawn.queryByRole('button', { name: 'Request' })).toBeNull();
  });

  it('adds seasons to a programme already asked for', async () => {
    answering({
      standing: {
        status: 'requested',
        mediaId: null,
        requestId: REQUEST_ID,
        requestState: 'wanted',
      },
      requests: [
        aMediaRequest({
          id: REQUEST_ID,
          kind: 'series',
          tmdbId: 95396,
          seasons: [1],
          items: [aRequestItem({ season: 1, episode: 1 })],
        }),
      ],
    });

    const drawn = await render(
      around(<AnAskable kind="series" id="95396" onOpen={jest.fn()} onBack={jest.fn()} />),
    );

    await waitFor(async () => {
      expect(await drawn.findByRole('switch', { name: 'Season 1' })).toBeDisabled();
    });

    await fireEvent(drawn.getByRole('switch', { name: 'Season 2' }), 'valueChange', true);
    await userEvent.press(drawn.getByRole('button', { name: 'Add seasons' }));

    expect(askForMedia).toHaveBeenCalledWith({
      kind: 'series',
      tmdbId: 95396,
      seasons: [2],
      followsNewSeasons: false,
    });
  });

  it('does not offer to take back somebody else’s request', async () => {
    answering({
      standing: {
        status: 'requested',
        mediaId: null,
        requestId: REQUEST_ID,
        requestState: 'wanted',
      },
      requests: [aMediaRequest({ id: REQUEST_ID, requestedBy: { id: 'other', name: 'Alex' } })],
    });

    const drawn = await drawIt();

    await drawn.findByText('Missing');

    expect(drawn.queryByRole('button', { name: 'Cancel request' })).toBeNull();
  });

  it('offers to watch a title a linked server has, or to request it here anyway', async () => {
    answering({
      standing: {
        status: 'linked',
        mediaId: 'theirs',
        requestId: null,
        requestState: null,
        fromServer: 'Films',
      },
    });
    const onOpen = jest.fn();

    const drawn = await drawIt(onOpen);

    await userEvent.press(await drawn.findByRole('button', { name: 'Watch on Films' }));

    expect(onOpen).toHaveBeenCalledWith('film', 'theirs');

    await userEvent.press(drawn.getByRole('button', { name: 'Request here' }));

    expect(askForMedia).toHaveBeenCalledWith({ kind: 'film', tmdbId: 438631 });
  });

  it('asks a linked server that takes requests, and only one that can be reached', async () => {
    answering({
      faces: [
        aLinkedServerFace({ takesRequests: true }),
        aLinkedServerFace({
          id: '00000000-0000-4000-8000-000000000002',
          name: 'Away',
          takesRequests: true,
          isReachable: false,
        }),
      ],
    });

    const drawn = await drawIt();

    await userEvent.press(await drawn.findByRole('button', { name: 'Ask Films' }));

    await waitFor(() => {
      expect(askLinkedServer).toHaveBeenCalledWith(aLinkedServerFace().id, {
        kind: 'film',
        tmdbId: 438631,
      });
    });
    expect(drawn.queryByRole('button', { name: 'Ask Away' })).toBeNull();
  });
});
