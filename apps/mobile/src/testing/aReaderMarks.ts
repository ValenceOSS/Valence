import type { Bookmark } from '@ValenceContracts/schemas/Book';
import type { DescribedBookmark } from '@ValenceClient/books/describeBookmark';
import type { AReaderMarks } from '@ValenceMobile/components/AReader/AReaderMarks';

type WatchedMarks = AReaderMarks & {
  onMark: jest.Mock;
  onUnmark: jest.Mock;
  onOpen: jest.Mock;
};

/**
 * The bookmarks a reader is handed, with every way of changing them watched.
 *
 * @param here - The bookmarks in the chapter open.
 * @param all - Every bookmark in the book, as the list shows them.
 * @returns The bookmarks and their handlers.
 */
const aReaderMarks = (
  here: readonly Bookmark[] = [],
  all: readonly DescribedBookmark[] = [],
): WatchedMarks => ({
  here,
  all,
  onMark: jest.fn(),
  onUnmark: jest.fn(),
  onOpen: jest.fn(),
});

export { aReaderMarks };
