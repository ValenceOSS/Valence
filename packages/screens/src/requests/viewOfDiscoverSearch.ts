/**
 * How an address names a search of Discover, as `find:dune`.
 *
 * @param query - The words searched for.
 * @returns What the address carries.
 */
const viewOfDiscoverSearch = (query: string): string => `find:${query.trim()}`;

export { viewOfDiscoverSearch };
