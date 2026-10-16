import type { SeriesBook } from '@ValenceContracts/schemas/MediaRequest';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';

/**
 * The books a series request fetches: every main book of the series, and the companions between
 * them only where they were ticked; never one Open Library does not know, as a book is asked for by
 * its Open Library id.
 *
 * @param series - The series request, with its books and the companions ticked.
 * @returns The books, in the series' order.
 */
const booksFollowed = (
  series: Pick<MediaRequestRecord, 'books' | 'companionsWanted'>,
): SeriesBook[] =>
  (series.books ?? []).filter(
    (book) =>
      book.openLibraryId !== null &&
      (!book.isCompanion || (series.companionsWanted ?? []).includes(book.asin)),
  );

export { booksFollowed };
