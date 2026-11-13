import type { DescribedBookmark } from '@ValenceClient/books/describeBookmark';

type ReaderBookmarksProps = {
  bookmarks: readonly DescribedBookmark[];
  onOpen: (bookmarkId: string) => void;
  onRemove: (bookmarkId: string) => void;
};

export type { ReaderBookmarksProps };
