import type { LibraryHealthReader } from './LibraryHealthReader';

const NOTHING = { total: 0, items: [] };

/**
 * Says nothing is wrong, for a server with no database of films and series to look through.
 *
 * @returns Empty lists, checked now.
 */
const readNoLibraryHealth: LibraryHealthReader = () =>
  Promise.resolve({
    checkedAt: new Date().toISOString(),
    unmatched: NOTHING,
    noArtwork: NOTHING,
    duplicate: NOTHING,
    unreadable: NOTHING,
  });

export { readNoLibraryHealth };
