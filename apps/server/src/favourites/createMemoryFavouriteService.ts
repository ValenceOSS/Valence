import type { FavouriteService } from './FavouriteService';
import type { Favourite, FavouriteBook } from '@ValenceContracts/schemas/Favourite';

type MemoryState = Record<string, Favourite[]>;

type MemoryBooks = Record<string, FavouriteBook[]>;

/**
 * Favourites held in memory, so the routes can be exercised without Postgres.
 *
 * @param state - Anything already kept.
 * @returns The favourite service.
 */
const createMemoryFavouriteService = (
  state: MemoryState = {},
  books: MemoryBooks = {},
): FavouriteService & { state: MemoryState; books: MemoryBooks } => ({
  state,
  books,

  list: (profileId) => Promise.resolve(state[profileId] ?? []),

  keep: (profileId, mediaId) => {
    const kept = state[profileId] ?? [];

    if (!kept.some((entry) => entry.mediaId === mediaId)) {
      state[profileId] = [{ mediaId, keptAt: new Date(0).toISOString() }, ...kept];
    }

    return Promise.resolve();
  },

  drop: (profileId, mediaId) => {
    state[profileId] = (state[profileId] ?? []).filter((entry) => entry.mediaId !== mediaId);

    return Promise.resolve();
  },

  listBooks: (profileId) => Promise.resolve(books[profileId] ?? []),

  keepBook: (profileId, bookId) => {
    const kept = books[profileId] ?? [];

    if (!kept.some((entry) => entry.bookId === bookId)) {
      books[profileId] = [{ bookId, keptAt: new Date(0).toISOString() }, ...kept];
    }

    return Promise.resolve();
  },

  dropBook: (profileId, bookId) => {
    books[profileId] = (books[profileId] ?? []).filter((entry) => entry.bookId !== bookId);

    return Promise.resolve();
  },
});

export type { MemoryState };

export { createMemoryFavouriteService };
