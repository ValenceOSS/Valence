const PREFIX = 'find:';

/**
 * Reads the words Discover is searching for, out of what the address carries, as `find:dune`.
 *
 * @param view - What the address carries, or nothing.
 * @returns The words, or null where the address names something else.
 */
const readDiscoverSearch = (view: string | null): string | null =>
  view !== null && view.startsWith(PREFIX) && view.length > PREFIX.length
    ? view.slice(PREFIX.length)
    : null;

export { readDiscoverSearch };
