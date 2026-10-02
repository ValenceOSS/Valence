import { render, userEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { FavouritesShelf } from '@ValenceTv/components/FavouritesShelf/FavouritesShelf';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const VIEWER = 'viewer';

const FILMS = ['00000000-0000-4000-8000-0000000000aa'];

/**
 * A film in the library.
 *
 * @param id - Which one.
 * @param title - What it is called.
 * @returns The film.
 */
const aFilm = (id: string, title: string): MediaSummary => ({
  id,
  libraryId: FILMS[0] ?? '',
  title,
  year: 2021,
  durationSeconds: 60,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-10-02T00:00:00.000Z',
  hasPoster: true,
  hasBackdrop: true,
  hasLogo: false,
  seriesId: null,
});

/**
 * A cache already holding what this viewer kept, and those of them the library has.
 *
 * @param kept - The ids kept, most recently kept first.
 * @param found - What the library answered for them.
 * @returns The cache.
 */
const aCache = (kept: string[], found: MediaSummary[]): QueryClient => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });

  cache.setQueryData(viewingQueries.favourites(VIEWER).queryKey, kept);
  cache.setQueryData(
    libraryQueries.across(FILMS, { ids: kept, limit: kept.length }).queryKey,
    found,
  );

  return cache;
};

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => undefined));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('FavouritesShelf', () => {
  it('shelves what was kept, most recently kept first, each opening its page', async () => {
    const onOpen = jest.fn();
    const drawn = await render(
      <QueryClientProvider
        client={aCache(['b', 'a'], [aFilm('a', 'Arrival'), aFilm('b', 'Blade Runner 2049')])}
      >
        <FavouritesShelf viewerId={VIEWER} watchable={FILMS} progress={new Map()} onOpen={onOpen} />
      </QueryClientProvider>,
    );

    expect(await drawn.findByText('Favourites')).toBeTruthy();

    const [first] = await drawn.findAllByRole('button', { name: /Arrival|Blade Runner 2049/ });

    expect(first).toBe(drawn.getByRole('button', { name: 'Blade Runner 2049' }));

    await userEvent.press(drawn.getByRole('button', { name: 'Arrival' }));

    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ title: 'Arrival' }));
  });

  it('leaves out what this television cannot play, and draws nothing with nothing left', async () => {
    const drawn = await render(
      <QueryClientProvider client={aCache(['song'], [])}>
        <FavouritesShelf
          viewerId={VIEWER}
          watchable={FILMS}
          progress={new Map()}
          onOpen={jest.fn()}
        />
      </QueryClientProvider>,
    );

    expect(drawn.queryByText('Favourites')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FavouritesShelf.displayName).toBe('FavouritesShelf');
  });
});
