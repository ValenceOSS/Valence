import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { KeptBookmarksSchema } from '@ValenceClient/books/KeptBookmarks';
import type { KeptBookmarks } from '@ValenceClient/books/KeptBookmarks';

/**
 * The bookmarks this device holds for a book: the last the server said it had, and the changes made
 * here that have not reached it yet.
 *
 * @param bookId - The book.
 * @returns What is held, or nothing held.
 */
const readKeptBookmarks = (bookId: string): KeptBookmarks => {
  const held = platformInUse().store.read(`valence.books.bookmarks.${bookId}`);

  try {
    const read = KeptBookmarksSchema.safeParse(held === null ? null : JSON.parse(held));

    return read.success ? read.data : { known: [], waiting: [] };
  } catch {
    return { known: [], waiting: [] };
  }
};

export { readKeptBookmarks };
