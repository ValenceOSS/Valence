import type { ReleaseSearch } from '@ValenceContracts/schemas/Indexer';

/**
 * A search as it would be asked by its words alone, without the catalogue ids it carries.
 *
 * @param search - The search.
 * @returns The same search, without its ids.
 */
const withoutIds = (search: ReleaseSearch): ReleaseSearch => {
  const words: ReleaseSearch = { ...search };

  delete words.imdbId;
  delete words.tmdbId;
  delete words.tvdbId;

  return words;
};

export { withoutIds };
