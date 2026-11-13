import { platformInUse } from '@ValenceClient/platform/installPlatform';
import type { KeptBookmarks } from '@ValenceClient/books/KeptBookmarks';

/**
 * Keeps a book's bookmarks on this device, with the changes still to be sent.
 *
 * @param bookId - The book.
 * @param kept - What to keep.
 */
const writeKeptBookmarks = (bookId: string, kept: KeptBookmarks): void => {
  platformInUse().store.write(`valence.books.bookmarks.${bookId}`, JSON.stringify(kept));
};

export { writeKeptBookmarks };
