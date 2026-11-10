import type { ReleaseSearch } from '@ValenceContracts/schemas/Indexer';

const AUDIOBOOKS = 3030;

const BOOKS = { from: 7000, to: 7999 };

/**
 * Whether a search could be answered with books: one made for a book, one narrowed to a book's
 * categories, or one typed with nothing to narrow it — so an indexer holding only books is not asked
 * about a film, an episode or an album, which it can only answer wrongly.
 *
 * @param search - The search.
 * @returns Whether books answer it.
 */
const asksForBooks = (search: Pick<ReleaseSearch, 'mode' | 'categories'>): boolean => {
  if (search.mode === 'book') {
    return true;
  }

  if (search.categories === undefined || search.categories.length === 0) {
    return search.mode === 'search';
  }

  return search.categories.some(
    (category) => category === AUDIOBOOKS || (category >= BOOKS.from && category <= BOOKS.to),
  );
};

export { asksForBooks };
