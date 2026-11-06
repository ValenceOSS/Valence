import type { TitleListAsk } from './TitleListAsk.types';

/**
 * Writes what a listing of titles asks for as the query of an address.
 *
 * @param asked - The library, order, search, quick filter and filter chips.
 * @param after - Where the last page stopped, where it is the next page being read.
 * @returns The query, with its question mark.
 */
const searchOfTitleList = (asked: TitleListAsk, after?: string): string => {
  const query = new URLSearchParams({
    libraryId: asked.libraryId,
    sort: asked.sort,
    desc: asked.isDescending ? 'true' : 'false',
    show: asked.show,
  });

  if (asked.search.trim() !== '') {
    query.set('search', asked.search.trim());
  }

  for (const filter of asked.filters) {
    query.append('filter', filter);
  }

  if (after !== undefined) {
    query.set('after', after);
  }

  return `?${query.toString()}`;
};

export { searchOfTitleList };
