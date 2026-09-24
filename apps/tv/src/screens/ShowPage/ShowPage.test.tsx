import { render, userEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { markWatched } from '@ValenceClient/playback/markWatched';
import { ShowPage } from '@ValenceTv/screens/ShowPage/ShowPage';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { ShowDetail } from '@ValenceContracts/schemas/Show';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

jest.mock('@ValenceClient/playback/markWatched', () => ({
  markWatched: jest.fn().mockResolvedValue(undefined),
}));

const LIBRARY = '00000000-0000-4000-8000-0000000000aa';

const SHOW = 'severance';

const anEpisode = (season: number, episode: number, title: string): MediaSummary => ({
  id: `00000000-0000-4000-8000-0000000${season.toString()}${episode.toString().padStart(4, '0')}`,
  libraryId: LIBRARY,
  title,
  year: 2022,
  durationSeconds: 3300,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-09-19T00:00:00.000Z',
  hasPoster: false,
  hasBackdrop: false,
  hasLogo: false,
  seriesId: SHOW,
  seriesTitle: 'Severance',
  seasonNumber: season,
  episodeNumber: episode,
});

const PILOT = anEpisode(1, 1, 'Good News About Hell');

const HALF_LOOP = anEpisode(1, 2, 'Half Loop');

const HELLO = anEpisode(2, 1, 'Hello, Ms. Cobel');

const SEVERANCE: ShowDetail = {
  id: SHOW,
  libraryId: LIBRARY,
  title: 'Severance',
  seasonCount: 2,
  episodeCount: 3,
  latestAddedAt: '2026-09-19T00:00:00.000Z',
  coverMediaId: PILOT.id,
  seriesId: null,
  year: 2022,
  rating: 8.7,
  genres: ['Drama', 'Mystery'],
  overview: null,
  seasons: [
    { seasonNumber: 1, episodes: [PILOT, HALF_LOOP] },
    { seasonNumber: 2, episodes: [HELLO] },
  ],
  shape: [
    {
      seasonNumber: 1,
      episodeCount: 2,
      episodes: [
        { episodeNumber: 1, title: 'Good News About Hell', overview: 'Mark is promoted.' },
        { episodeNumber: 2, title: 'Half Loop', overview: 'Helly tries to leave.' },
      ],
    },
  ],
};

const watching = (
  episode: MediaSummary,
  positionSeconds: number,
  isFinished = false,
): WatchProgress => ({
  mediaId: episode.id,
  positionSeconds,
  durationSeconds: 3300,
  isFinished,
  updatedAt: '2026-09-19T00:00:00.000Z',
});

const aCacheHolding = (show: ShowDetail | null, progress: WatchProgress[] = []): QueryClient => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });

  if (show !== null) {
    cache.setQueryData(libraryQueries.show(LIBRARY, SHOW).queryKey, show);
  }

  cache.setQueryData(viewingQueries.progress().queryKey, progress);

  return cache;
};

const drawShow = (cache: QueryClient, onPlay = jest.fn()) =>
  render(
    <QueryClientProvider client={cache}>
      <ShowPage libraryId={LIBRARY} showId={SHOW} onPlay={onPlay} />
    </QueryClientProvider>,
  );

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => undefined));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ShowPage', () => {
  it('says so when the programme cannot be found', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('offline'));

    const drawn = await drawShow(aCacheHolding(null));

    expect(await drawn.findByText('This programme could not be found.')).toBeTruthy();
  });

  it('says what the programme is and what happens in the episode to watch next', async () => {
    const drawn = await drawShow(aCacheHolding(SEVERANCE));

    expect(drawn.getAllByText('Severance').length).toBeGreaterThan(0);
    expect(drawn.getByText(/2 seasons/)).toBeTruthy();
    expect(drawn.getByText(/★ 8\.7/)).toBeTruthy();
    expect(drawn.getByText('S1: E1 · Good News About Hell')).toBeTruthy();
    expect(drawn.getAllByText('Mark is promoted.').length).toBeGreaterThan(0);
    expect(drawn.getByText('Drama, Mystery')).toBeTruthy();
  });

  it('starts somebody new from the first episode', async () => {
    const onPlay = jest.fn();
    const drawn = await drawShow(aCacheHolding(SEVERANCE), onPlay);

    expect(drawn.queryByRole('button', { name: 'Play from the first episode' })).toBeNull();

    await userEvent.press(drawn.getByRole('button', { name: 'Play S1: E1' }));

    expect(onPlay).toHaveBeenCalledWith(PILOT, 0);
  });

  it('carries on from where this viewer left off, or goes back to the first episode', async () => {
    const onPlay = jest.fn();
    const drawn = await drawShow(aCacheHolding(SEVERANCE, [watching(HALF_LOOP, 600)]), onPlay);

    await userEvent.press(drawn.getByRole('button', { name: 'Resume S1: E2 from 10:00' }));

    expect(onPlay).toHaveBeenLastCalledWith(HALF_LOOP, 600);

    await userEvent.press(drawn.getByRole('button', { name: 'Play from the first episode' }));

    expect(onPlay).toHaveBeenLastCalledWith(PILOT, 0);
  });

  it('lands on the season of the episode to carry on with', async () => {
    const drawn = await drawShow(
      aCacheHolding(SEVERANCE, [watching(PILOT, 3300, true), watching(HALF_LOOP, 3300, true)]),
    );

    expect(drawn.getByRole('button', { name: 'Play S2: E1' })).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Hello, Ms. Cobel' })).toBeTruthy();
    expect(drawn.queryByRole('button', { name: 'Half Loop' })).toBeNull();
  });

  it('shows the episodes of the season chosen, and plays the one chosen', async () => {
    const onPlay = jest.fn();
    const drawn = await drawShow(aCacheHolding(SEVERANCE), onPlay);

    expect(drawn.getByRole('button', { name: 'Half Loop' })).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Season 2' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Hello, Ms. Cobel' }));

    expect(drawn.queryByRole('button', { name: 'Half Loop' })).toBeNull();
    expect(onPlay).toHaveBeenCalledWith(HELLO, 0);
  });

  it('heads a programme of one season with its episodes rather than a row of seasons', async () => {
    const drawn = await drawShow(
      aCacheHolding({
        ...SEVERANCE,
        seasonCount: 1,
        seasons: [{ seasonNumber: 1, episodes: [PILOT, HALF_LOOP] }],
      }),
    );

    expect(drawn.getByText('Episodes')).toBeTruthy();
    expect(drawn.getByText(/1 season/)).toBeTruthy();
    expect(drawn.queryByRole('button', { name: 'Season 1' })).toBeNull();
  });

  it('marks the season shown watched, and offers to take it back once it is', async () => {
    const drawn = await drawShow(aCacheHolding(SEVERANCE));

    await userEvent.press(drawn.getByRole('button', { name: 'Mark this season watched' }));

    expect(markWatched).toHaveBeenLastCalledWith([PILOT, HALF_LOOP], true);

    const seen = await drawShow(
      aCacheHolding(
        SEVERANCE,
        [PILOT, HALF_LOOP, HELLO].map((one) => ({
          mediaId: one.id,
          positionSeconds: one.durationSeconds,
          durationSeconds: one.durationSeconds,
          isFinished: true,
          updatedAt: '2026-09-19T00:00:00.000Z',
        })),
      ),
    );

    expect(
      seen.getAllByRole('button', { name: 'Mark this season unwatched' }).length,
    ).toBeGreaterThan(0);
  });

  it('marks one episode watched when select is held on it', async () => {
    const drawn = await drawShow(aCacheHolding(SEVERANCE));

    await userEvent.longPress(drawn.getByRole('button', { name: 'Half Loop' }));

    expect(markWatched).toHaveBeenLastCalledWith([HALF_LOOP], true);
  });
});
