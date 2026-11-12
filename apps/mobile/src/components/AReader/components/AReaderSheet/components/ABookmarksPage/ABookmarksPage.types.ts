import type { DescribedBookmark } from '@ValenceClient/books/describeBookmark';

type ABookmarksPageProps = {
  bookmarks: readonly DescribedBookmark[];
  onBookmark: (bookmarkId: string) => void;
  onRemove: (bookmarkIds: readonly string[]) => void;
};

export type { ABookmarksPageProps };
