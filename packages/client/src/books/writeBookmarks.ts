import { platformInUse } from '@ValenceClient/platform/installPlatform';

/**
 * Remembers the pages somebody has marked in one chapter of a book, on this device.
 *
 * @param bookId - The book.
 * @param chapterId - The chapter.
 * @param pages - The marked pages, counting from nothing.
 */
const writeBookmarks = (bookId: string, chapterId: string, pages: readonly number[]): void => {
  platformInUse().store.write(
    `valence.reader.bookmarks.${bookId}.${chapterId}`,
    JSON.stringify([...new Set(pages)].sort((one, other) => one - other)),
  );
};

export { writeBookmarks };
