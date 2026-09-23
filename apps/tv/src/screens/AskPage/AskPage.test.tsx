import { render, userEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { askForMedia, removeMediaRequest } from '@ValenceClient/requests/fetchMediaRequests';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { AskPage } from '@ValenceTv/screens/AskPage/AskPage';
import type { CatalogueTitleDetail } from '@ValenceContracts/schemas/CatalogueTitle';
import type { CatalogueSeason } from '@ValenceContracts/schemas/MediaRequest';

jest.mock('@ValenceClient/session/auth', () => ({
  fetchSession: () => new Promise(() => undefined),
}));

jest.mock('@ValenceClient/requests/fetchMediaRequests', () => ({
  ...jest.requireActual<object>('@ValenceClient/requests/fetchMediaRequests'),
  askForMedia: jest.fn(),
  removeMediaRequest: jest.fn(),
}));

const REQUEST_ID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

const HD = '00000000-0000-4000-8000-00000000000a';

const UHD = '00000000-0000-4000-8000-00000000000b';

const ME = { id: 'me', name: 'Marques', email: 'marques@example.com', emailVerified: true };

const aTitle = (overrides: Partial<CatalogueTitleDetail> = {}): CatalogueTitleDetail => ({
  kind: 'film',
  id: '438631',
  title: 'Dune',
  subtitle: null,
  year: 2021,
  overview: 'A noble family becomes embroiled in a war.',
  posterUrl: null,
  standing: { status: 'askable', mediaId: null, requestId: null, requestState: null },
  musicBrainzId: null,
  backdropUrl: '/backdrops/dune.jpg',
  genres: ['Science Fiction', 'Adventure'],
  runtimeMinutes: 155,
  cast: [{ name: 'Timothée Chalamet', role: 'Paul', photoUrl: null }],
  albums: [],
  authors: [],
  trailerKey: null,
  ...overrides,
});

const aSeason = (season: number, standing: CatalogueSeason['standing']): CatalogueSeason => ({
  season,
  episodeCount: 10,
  firstAired: null,
  standing,
});

type Held = {
  title: CatalogueTitleDetail;
  kind?: 'film' | 'series';
  seasons?: CatalogueSeason[];
  choices?: { id: string; name: string; kind: 'video' }[];
};

const aCacheHolding = ({ title, kind = 'film', seasons = [], choices = [] }: Held): QueryClient => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });

  cache.setQueryData(requestsQueries.askable(kind, title.id).queryKey, title);
  cache.setQueryData(requestsQueries.seriesSeasons(Number(title.id)).queryKey, seasons);
  cache.setQueryData(requestsQueries.profilesOnOffer(kind).queryKey, { choices, forcedId: null });
  cache.setQueryData(requestsQueries.mediaRequests().queryKey, [
    aMediaRequest({ id: REQUEST_ID, requestedBy: { id: 'me', name: 'Marques' } }),
  ]);
  cache.setQueryData(sessionQueries.who().queryKey, ME);

  return cache;
};

const drawAsk = (
  cache: QueryClient,
  told: { kind?: 'film' | 'series'; onOpenFilm?: (mediaId: string) => void } = {},
) =>
  render(
    <QueryClientProvider client={cache}>
      <AskPage
        kind={told.kind ?? 'film'}
        id="438631"
        onOpenFilm={told.onOpenFilm ?? jest.fn()}
        onLight={jest.fn()}
      />
    </QueryClientProvider>,
  );

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => undefined));
  jest.mocked(askForMedia).mockReset();
  jest.mocked(removeMediaRequest).mockReset();
  jest.mocked(askForMedia).mockResolvedValue({ value: aMediaRequest(), refusal: null });
  jest.mocked(removeMediaRequest).mockResolvedValue(null);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('AskPage', () => {
  it('says so when the title cannot be found', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('offline'));
    const cache = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });

    const drawn = await drawAsk(cache);

    expect(await drawn.findByText('This title could not be found.')).toBeTruthy();
  });

  it('lights the page with the title and says what it is and who is in it', async () => {
    const onLight = jest.fn();
    const drawn = await render(
      <QueryClientProvider client={aCacheHolding({ title: aTitle() })}>
        <AskPage kind="film" id="438631" onOpenFilm={jest.fn()} onLight={onLight} />
      </QueryClientProvider>,
    );

    expect(drawn.getByText('A noble family becomes embroiled in a war.')).toBeTruthy();
    expect(drawn.getByText('Starring Timothée Chalamet')).toBeTruthy();
    expect(onLight).toHaveBeenCalledWith('/backdrops/dune.jpg');
  });

  it('asks for a film as it is', async () => {
    const drawn = await drawAsk(aCacheHolding({ title: aTitle() }));

    await userEvent.press(drawn.getByRole('button', { name: 'Request' }));

    expect(askForMedia).toHaveBeenCalledWith({ kind: 'film', tmdbId: 438631 });
  });

  it('lists the qualities on offer first and asks in the one chosen', async () => {
    const drawn = await drawAsk(
      aCacheHolding({
        title: aTitle(),
        choices: [
          { id: HD, name: 'HD', kind: 'video' },
          { id: UHD, name: '4K', kind: 'video' },
        ],
      }),
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Request' }));

    expect(askForMedia).not.toHaveBeenCalled();
    expect(drawn.getByRole('button', { name: 'Not now' })).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Request in 4K' }));

    expect(askForMedia).toHaveBeenCalledWith({ kind: 'film', tmdbId: 438631, profileId: UHD });
  });

  it('goes back to asking when not now is chosen', async () => {
    const drawn = await drawAsk(
      aCacheHolding({
        title: aTitle(),
        choices: [
          { id: HD, name: 'HD', kind: 'video' },
          { id: UHD, name: '4K', kind: 'video' },
        ],
      }),
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Request' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Not now' }));

    expect(drawn.getByRole('button', { name: 'Request' })).toBeTruthy();
  });

  it('says why asking was refused', async () => {
    jest.mocked(askForMedia).mockResolvedValue({
      value: null,
      refusal: { message: 'You have asked for too much this week.' },
    });
    const drawn = await drawAsk(aCacheHolding({ title: aTitle() }));

    await userEvent.press(drawn.getByRole('button', { name: 'Request' }));

    expect(await drawn.findByText('You have asked for too much this week.')).toBeTruthy();
  });

  it('opens a film the library already has', async () => {
    const onOpenFilm = jest.fn();
    const drawn = await drawAsk(
      aCacheHolding({
        title: aTitle({
          standing: { status: 'library', mediaId: 'media-1', requestId: null, requestState: null },
        }),
      }),
      { onOpenFilm },
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Open' }));

    expect(onOpenFilm).toHaveBeenCalledWith('media-1');
    expect(drawn.queryByRole('button', { name: 'Request' })).toBeNull();
  });

  it('asks for the seasons of a show still to be had, as chosen', async () => {
    const drawn = await drawAsk(
      aCacheHolding({
        kind: 'series',
        title: aTitle({ kind: 'series' }),
        seasons: [aSeason(1, 'library'), aSeason(2, 'askable'), aSeason(3, 'askable')],
      }),
      { kind: 'series' },
    );

    expect(
      drawn.getByRole('button', { name: 'Season 1 · 10 episodes · In the library' }),
    ).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Season 3 · 10 episodes' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Request 1 season' }));

    expect(askForMedia).toHaveBeenCalledWith({ kind: 'series', tmdbId: 438631, seasons: [2] });
  });

  it('offers no request once every season is unchosen', async () => {
    const drawn = await drawAsk(
      aCacheHolding({
        kind: 'series',
        title: aTitle({ kind: 'series' }),
        seasons: [aSeason(1, 'askable'), aSeason(2, 'askable')],
      }),
      { kind: 'series' },
    );

    expect(drawn.getByRole('button', { name: 'Request 2 seasons' })).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Season 1 · 10 episodes' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Season 2 · 10 episodes' }));

    expect(drawn.queryByRole('button', { name: /^Request/ })).toBeNull();
  });

  it('cancels a request this viewer made', async () => {
    const drawn = await drawAsk(
      aCacheHolding({
        title: aTitle({
          standing: {
            status: 'requested',
            mediaId: null,
            requestId: REQUEST_ID,
            requestState: 'wanted',
          },
        }),
      }),
    );

    expect(drawn.getByText('Requested')).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Cancel request' }));

    await waitFor(() => {
      expect(removeMediaRequest).toHaveBeenCalledWith(REQUEST_ID, true);
    });
  });
});
