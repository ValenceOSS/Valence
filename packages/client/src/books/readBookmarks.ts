import { z } from 'zod';
import { platformInUse } from '@ValenceClient/platform/installPlatform';

const BookmarksSchema = z.array(z.number().int().min(0));

/**
 * The pages somebody has marked in one chapter of a book, kept on this device like how they read.
 *
 * @param bookId - The book.
 * @param chapterId - The chapter.
 * @returns The marked pages, counting from nothing, in order.
 */
const readBookmarks = (bookId: string, chapterId: string): number[] => {
  const held = platformInUse().store.read(`valence.reader.bookmarks.${bookId}.${chapterId}`);
  const read = BookmarksSchema.safeParse(held === null ? null : JSON.parse(held));

  return read.success ? [...read.data].sort((one, other) => one - other) : [];
};

export { readBookmarks };
