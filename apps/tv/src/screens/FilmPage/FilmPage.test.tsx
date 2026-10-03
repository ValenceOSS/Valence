import { render, userEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { linkingQueries } from '@ValenceClient/query/linkingQueries';
import { aLibrary } from '@ValenceClient/testing/aLibrary';
import { aLinkedServerFace } from '@ValenceClient/testing/aLinkedServerFace';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { setFavourite } from '@ValenceClient/library/fetchFavourites';
import { setRating } from '@ValenceClient/library/fetchRatings';
import { setHidden } from '@ValenceClient/library/fetchHidden';
import { Alert } from 'react-native';
import { MediaDetailSchema } from '@ValenceContracts/schemas/Library';
import { summariseDetail } from '@ValenceClient/library/summariseDetail';
import { FilmPage } from '@ValenceTv/screens/FilmPage/FilmPage';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

jest.mock('@ValenceClient/library/fetchFavourites', () => ({
  ...jest.requireActual<object>('@ValenceClient/library/fetchFavourites'),
  setFavourite: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@ValenceClient/library/fetchRatings', () => ({
  ...jest.requireActual<object>('@ValenceClient/library/fetchRatings'),
  setRating: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@ValenceClient/library/fetchHidden', () => ({
  ...jest.requireActual<object>('@ValenceClient/library/fetchHidden'),
  setHidden: jest.fn(() => Promise.resolve(true)),
}));

const FILM = '00000000-0000-4000-8000-000000000001';

const VIEWER = '00000000-0000-4000-8000-0000000000ff';

const DIRECTORS = '00000000-0000-4000-8000-000000000002';

const TRAILER = '00000000-0000-4000-8000-000000000003';

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
  film = ARRIVAL,
}: {
  progress?: WatchProgress[];
  kept?: string[];
  isFound?: boolean;
  film?: typeof ARRIVAL;
}): QueryClient => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });

  if (isFound) {
    cache.setQueryData(libraryQueries.detail(FILM).queryKey, film);
  }

  cache.setQueryData(viewingQueries.progress().queryKey, progress);
  cache.setQueryData(viewingQueries.favourites(VIEWER).queryKey, kept);
  cache.setQueryData(viewingQueries.ratings(VIEWER).queryKey, []);
  cache.setQueryData(viewingQueries.hidden(VIEWER).queryKey, []);

  return cache;
};

const drawFilm = (cache: QueryClient, onPlay = jest.fn(), onOpenPerson = jest.fn()) =>
  render(
    <QueryClientProvider client={cache}>
      <FilmPage mediaId={FILM} viewerId={VIEWER} onPlay={onPlay} onOpenPerson={onOpenPerson} />
    </QueryClientProvider>,
  );

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => undefined));
  jest.mocked(setFavourite).mockClear();
  jest.mocked(setRating).mockClear();
  jest.mocked(setHidden).mockClear();
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

  it('gives the film stars from the panel, and says how many afterwards', async () => {
    const drawn = await drawFilm(aCacheHolding({}));

    await userEvent.press(drawn.getByRole('button', { name: 'Rate it' }));
    await userEvent.press(drawn.getByRole('button', { name: '4 stars' }));

    await waitFor(() => {
      expect(setRating).toHaveBeenCalledWith({ mediaId: FILM }, 4);
    });
    expect(drawn.queryByRole('button', { name: '5 stars' })).toBeNull();
    expect(await drawn.findByRole('button', { name: 'Your rating, 4 stars' })).toBeTruthy();
  });

  it('hides the film only once somebody says so', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

    const drawn = await drawFilm(aCacheHolding({}));

    await userEvent.press(drawn.getByRole('button', { name: 'Hide' }));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Hide Arrival?',
        expect.any(String),
        expect.any(Array),
      );
    });
    expect(setHidden).not.toHaveBeenCalled();

    const buttons = jest.mocked(Alert.alert).mock.calls.at(-1)?.[2] ?? [];

    buttons.find((button) => button.text === 'Hide it')?.onPress?.();

    await waitFor(() => {
      expect(setHidden).toHaveBeenCalledWith({ kind: 'item', subjectId: FILM }, true);
    });
  });

  it('plays the cut chosen from the panel, and the trailer kept beside it', async () => {
    const directors = {
      ...summariseDetail(ARRIVAL),
      id: DIRECTORS,
      versionLabel: "Director's Cut",
    };
    const trailer = { ...summariseDetail(ARRIVAL), id: TRAILER, extraKind: 'trailer' as const };
    const onPlay = jest.fn();
    const drawn = await drawFilm(
      aCacheHolding({ film: { ...ARRIVAL, versions: [directors], extras: [trailer] } }),
      onPlay,
    );

    await userEvent.press(drawn.getByRole('button', { name: /^Which version to play/ }));
    await userEvent.press(drawn.getByRole('button', { name: "Director's Cut" }));
    await userEvent.press(drawn.getByRole('button', { name: 'Play' }));

    expect(onPlay).toHaveBeenLastCalledWith(expect.objectContaining({ id: DIRECTORS }), 0);

    await userEvent.press(drawn.getByRole('button', { name: 'Trailer' }));

    expect(onPlay).toHaveBeenLastCalledWith(expect.objectContaining({ id: TRAILER }), 0);
  });

  it('offers no version choice or trailer where the library holds neither', async () => {
    const drawn = await drawFilm(aCacheHolding({}));

    expect(drawn.queryByRole('button', { name: /^Which version to play/ })).toBeNull();
    expect(drawn.queryByRole('button', { name: 'Trailer' })).toBeNull();
  });

  it('opens the page of somebody in the cast', async () => {
    const onOpenPerson = jest.fn();
    const drawn = await drawFilm(
      aCacheHolding({
        film: {
          ...ARRIVAL,
          metadata: {
            ...ARRIVAL.metadata,
            cast: [{ personId: 9273, name: 'Amy Adams', role: 'Louise', imageUrl: null }],
          },
        },
      }),
      jest.fn(),
      onOpenPerson,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Amy Adams, Louise' }));

    expect(onOpenPerson).toHaveBeenCalledWith(9273);
  });

  it('says which linked server a film comes from, and that it cannot be reached', async () => {
    const cache = aCacheHolding({});

    cache.setQueryData(libraryQueries.all().queryKey, [
      aLibrary({ id: ARRIVAL.libraryId, linkedServerId: aLinkedServerFace().id }),
    ]);
    cache.setQueryData(linkingQueries.faces().queryKey, [
      aLinkedServerFace({ isReachable: false }),
    ]);

    const drawn = await drawFilm(cache);

    expect(drawn.getByText(/Films cannot be reached right now/u)).toBeTruthy();
  });
});
