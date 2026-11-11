import { z } from 'zod';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { randomId } from '@ValenceClient/platform/randomId';
import type { Bookmark } from '@ValenceContracts/schemas/Book';

const OldMarksSchema = z.array(z.number().int().min(0));

const OLD_TEXT_STEPS = 1_000_000;

/**
 * Reads one chapter's bookmarks as the phone used to keep them, on the phone alone, and forgets them
 * there.
 *
 * @param key - Where they were kept.
 * @returns The places marked, or nothing.
 */
const takeOldMarks = (key: string): number[] => {
  const store = platformInUse().store;
  const held = store.read(key);

  if (held === null) {
    return [];
  }

  store.forget(key);

  try {
    const read = OldMarksSchema.safeParse(JSON.parse(held));

    return read.success ? [...new Set(read.data)] : [];
  } catch {
    return [];
  }
};

/**
 * Takes the bookmarks this device kept for a book before bookmarks were kept on the server, as new
 * bookmarks to be sent there, and forgets the old copies. A page of a comic was kept as its number,
 * and a place in a book's text as millionths of the way through the file.
 *
 * @param bookId - The book.
 * @param chapterIds - Its chapters.
 * @returns The bookmarks found, none of them sent yet.
 */
const takeOldBookmarks = (bookId: string, chapterIds: readonly string[]): Bookmark[] => {
  const now = new Date().toISOString();

  return chapterIds.flatMap((chapterId) => {
    const base = {
      bookId,
      chapterId,
      pageShown: null,
      excerpt: null,
      picture: null,
      createdAt: now,
    };
    const pages = takeOldMarks(`valence.reader.bookmarks.${bookId}.${chapterId}`).map(
      (pageNumber) => ({ ...base, id: randomId(), pageNumber, fraction: null }),
    );
    const places = takeOldMarks(`valence.reader.bookmarks.${bookId}.${chapterId}:text`).map(
      (step) => ({
        ...base,
        id: randomId(),
        pageNumber: null,
        fraction: Math.min(step / OLD_TEXT_STEPS, 1),
      }),
    );

    return [...pages, ...places];
  });
};

export { takeOldBookmarks };
