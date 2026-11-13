import type { ReactNode } from 'react';
import type { Bookmark } from '@ValenceContracts/schemas/Book';
import type { BookmarkPlace } from '@ValenceClient/books/useBookmarks';

type ReaderMarks = {
  here: readonly Bookmark[];
  list: ReactNode;
  onMark: (place: Omit<BookmarkPlace, 'chapterId'>) => void;
  onUnmark: (bookmarkIds: readonly string[]) => void;
};

export type { ReaderMarks };
