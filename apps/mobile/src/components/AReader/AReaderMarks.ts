import type { Bookmark } from '@ValenceContracts/schemas/Book';
import type { BookmarkPlace } from '@ValenceClient/books/useBookmarks';
import type { DescribedBookmark } from '@ValenceClient/books/describeBookmark';

type AReaderMarks = {
  here: readonly Bookmark[];
  all: readonly DescribedBookmark[];
  onMark: (place: Omit<BookmarkPlace, 'chapterId'>) => void;
  onUnmark: (bookmarkIds: readonly string[]) => void;
  onOpen: (bookmarkId: string) => void;
};

export type { AReaderMarks };
