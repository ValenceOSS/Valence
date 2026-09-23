import { render, userEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { setFavourite } from '@ValenceClient/library/fetchFavourites';
import { MediaDetailSchema } from '@ValenceContracts/schemas/Library';
import { FilmPage } from '@ValenceTv/screens/FilmPage/FilmPage';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

jest.mock('@ValenceClient/library/fetchFavourites', () => ({
  ...jest.requireActual<object>('@ValenceClient/library/fetchFavourites'),
  setFavourite: jest.fn(() => Promise.resolve(true)),
}));

const FILM = '00000000-0000-4000-8000-000000000001';

const VIEWER = '00000000-0000-4000-8000-0000000000ff';

const ARRIVAL = MediaDetailSchema.parse({
  id: FILM,
  libraryId: '00000000-0000-4000-8000-0000000000aa',
  title: 'Arrival',
  year: 2016,
  container: 'mkv',
  durationSeconds: 6960,
  videoCodec: 'h264',
  videoRange: 'SDR',
  width: 1920,
  height: 1080,
  bitrateKbps: 8000,
  audioStreams: [{ index: 1, codec: 'aac', channels: 6, isAtmos: false }],
  subtitleStreams: [],
  addedAt: '2026-09-19T00:00:00.000Z',
  metadata: {
    overview: 'A linguist is recruited to talk to visitors.',
    tagline: 'Why are they here?',
    genres: ['Drama', 'Science Fiction'],
    cast: [{ name: 'Amy Adams', role: 'Louise', imageUrl: null }],
    rating: 7.9,
    hasPoster: true,
    hasBackdrop: true,
    hasLogo: false,
  },
});

const HALFWAY: WatchProgress = {
  mediaId: FILM,
  positionSeconds: 3600,
  durationSeconds: 6960,
  isFinished: false,
  updatedAt: '2026-09-19T00:00:00.000Z',
};

const aCacheHolding = ({
  progress = [],
  kept = [],
  isFound = true,
}: {
  progress?: WatchProgress[];
  kept?: string[];
  isFound?: boolean;
}): QueryClient => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });

  if (isFound) {
    cache.setQueryData(libraryQueries.detail(FILM).queryKey, ARRIVAL);
  }

  cache.setQueryData(viewingQueries.progress().queryKey, progress);
  cache.setQueryData(viewingQueries.favourites(VIEWER).queryKey, kept);

  return cache;
};

const drawFilm = (cache: QueryClient, onPlay = jest.fn()) =>
  render(
    <QueryClientProvider client={cache}>
      <FilmPage mediaId={FILM} viewerId={VIEWER} onPlay={onPlay} />
    </QueryClientProvider>,
  );

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => undefined));
  jest.mocked(setFavourite).mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('FilmPage', () => {
  it('says so when the film cannot be found', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('offline'));

    const drawn = await drawFilm(aCacheHolding({ isFound: false }));

    expect(await drawn.findByText('This film could not be found.')).toBeTruthy();
  });

  it('says everything about the film beside its picture', async () => {
    const drawn = await drawFilm(aCacheHolding({}));

    expect(drawn.getByText('Arrival')).toBeTruthy();
    expect(drawn.getByText(/2016/)).toBeTruthy();
    expect(drawn.getByText(/★ 7\.9/)).toBeTruthy();
    expect(drawn.getByText('Why are they here?')).toBeTruthy();
    expect(drawn.getByText('A linguist is recruited to talk to visitors.')).toBeTruthy();
    expect(drawn.getByText('Starring Amy Adams')).toBeTruthy();
    expect(drawn.getByText('Drama, Science Fiction')).toBeTruthy();
  });

  it('plays a film nobody has started from the beginning', async () => {
    const onPlay = jest.fn();
    const drawn = await drawFilm(aCacheHolding({}), onPlay);

    expect(drawn.queryByRole('button', { name: 'Play from the beginning' })).toBeNull();

    await userEvent.press(drawn.getByRole('button', { name: 'Play' }));

    expect(onPlay).toHaveBeenCalledWith(expect.objectContaining({ id: FILM, title: 'Arrival' }), 0);
  });

  it('carries on from where this viewer left off, or starts again', async () => {
    const onPlay = jest.fn();
    const drawn = await drawFilm(aCacheHolding({ progress: [HALFWAY] }), onPlay);

    await userEvent.press(drawn.getByRole('button', { name: 'Resume from 1:00:00' }));

    expect(onPlay).toHaveBeenLastCalledWith(expect.objectContaining({ id: FILM }), 3600);

    await userEvent.press(drawn.getByRole('button', { name: 'Play from the beginning' }));

    expect(onPlay).toHaveBeenLastCalledWith(expect.objectContaining({ id: FILM }), 0);
  });

  it('puts the film on this viewer’s list', async () => {
    const drawn = await drawFilm(aCacheHolding({}));

    await userEvent.press(drawn.getByRole('button', { name: 'Add to My List' }));

    expect(setFavourite).toHaveBeenCalledWith(FILM, true);
    expect(await drawn.findByRole('button', { name: 'Remove from My List' })).toBeTruthy();
  });

  it('takes a film already kept off the list', async () => {
    const drawn = await drawFilm(aCacheHolding({ kept: [FILM] }));

    await userEvent.press(drawn.getByRole('button', { name: 'Remove from My List' }));

    await waitFor(() => {
      expect(setFavourite).toHaveBeenCalledWith(FILM, false);
    });
  });
});
