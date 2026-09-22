import { Alert } from 'react-native';
import { render, userEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { askForMedia, removeMediaRequest } from '@ValenceClient/requests/fetchMediaRequests';
import { fetchSession } from '@ValenceClient/session/auth';
import { aCatalogueTitle } from '@ValenceClient/testing/aCatalogueTitle';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { AnAskable } from './AnAskable';
import type { ReactNode } from 'react';
import type {
  CatalogueStanding,
  CatalogueTitleDetail,
} from '@ValenceContracts/schemas/CatalogueTitle';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { ProfilesOnOffer } from '@ValenceContracts/schemas/QualityProfile';
import { theAddressOf } from '@ValencePhone/testing/theAddressOf';

jest.mock('@ValenceClient/requests/fetchMediaRequests', () => ({
  ...jest.requireActual<object>('@ValenceClient/requests/fetchMediaRequests'),
  askForMedia: jest.fn(),
  removeMediaRequest: jest.fn(),
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
const theDetail = (standing: CatalogueStanding): CatalogueTitleDetail => ({
  ...aCatalogueTitle({ standing }),
  musicBrainzId: null,
  backdropUrl: null,
  genres: ['Science Fiction'],
  runtimeMinutes: 155,
  cast: [],
  albums: [],
  authors: [],
  trailerKey: null,
});

/**
 * Answers every question the page asks.
 */
const answering = ({
  standing = { status: 'askable', mediaId: null, requestId: null, requestState: null },
  requests = [],
  offered = { choices: [], forcedId: null },
}: {
  standing?: CatalogueStanding;
  requests?: MediaRequest[];
  offered?: ProfilesOnOffer;
}) => {
  globalThis.fetch = jest.fn((input: RequestInfo | URL) =>
    Promise.resolve(
      theAddressOf(input).includes('/catalogue/title/')
        ? Response.json(theDetail(standing))
        : theAddressOf(input).includes('/api/requests/profiles')
          ? Response.json(offered)
          : theAddressOf(input).endsWith('/api/requests/media')
            ? Response.json(requests)
            : Response.json([]),
    ),
  );
};

const drawIt = async () =>
  render(around(<AnAskable kind="film" id="438631" onOpen={jest.fn()} onBack={jest.fn()} />));

beforeEach(() => {
  jest.mocked(askForMedia).mockReset().mockResolvedValue({ value: null, refusal: null });
  jest.mocked(removeMediaRequest).mockReset().mockResolvedValue(null);
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

  it('offers to open it once it is in the library', async () => {
    answering({
      standing: { status: 'library', mediaId: 'm-1', requestId: null, requestState: null },
    });

    const drawn = await drawIt();

    expect(await drawn.findByRole('button', { name: 'Open' })).toBeTruthy();
    expect(drawn.queryByRole('button', { name: 'Request' })).toBeNull();
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

    await drawn.findByText('Requested');

    expect(drawn.queryByRole('button', { name: 'Cancel request' })).toBeNull();
  });
});
