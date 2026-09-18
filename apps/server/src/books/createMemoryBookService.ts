import type {
  Book,
  BookChapter,
  BookContents,
  ReadingProgress,
} from '@ValenceContracts/schemas/Book';
import type { BookService } from './createDatabaseBookService';

type MemoryBooks = {
  books: Book[];
  chapters: BookChapter[];
  contents?: Record<string, BookContents>;
  documents?: Record<string, string>;
};

/**
 * A shelf held in memory, for tests of everything that reads a shelf without scanning one.
 *
 * It holds what it is given and nothing is ever drawn: a page, a picture and a cover each come back
 * as the same few bytes, since what a test wants to know is whether one was served, not what it
 * looked like. A part of a book is found by `chapterId:part`, and the address a picture is given is
 * written into it where it names `{picture}`.
 *
 * @param given - The books, their chapters, and what the ones that reflow hold.
 * @returns The shelf.
 */
const createMemoryBookService = (given: MemoryBooks): BookService => {
  const progress: { profileId: string; entry: ReadingProgress }[] = [];
  const bytes = { bytes: new Uint8Array([1, 2, 3]), contentType: 'image/png' };
  const chapterOf = (chapterId: string) =>
    given.chapters.find((chapter) => chapter.id === chapterId);

  return {
    listStored: () => Promise.resolve([]),
    upsertBook: () => Promise.resolve(null),
    upsertChapter: () => Promise.resolve(),
    removeByPaths: () => Promise.resolve(0),
    markScanned: () => Promise.resolve(),

    list: (libraryId) =>
      Promise.resolve(given.books.filter((book) => book.libraryId === libraryId)),

    read: (bookId) => {
      const book = given.books.find((one) => one.id === bookId);

      return Promise.resolve(
        book === undefined
          ? null
          : { book, chapters: given.chapters.filter((chapter) => chapter.bookId === bookId) },
      );
    },

    readPage: (chapterId) =>
      Promise.resolve(chapterOf(chapterId)?.format === 'epub' ? null : bytes),

    readContents: (chapterId) => Promise.resolve(given.contents?.[chapterId] ?? null),

    readDocument: (chapterId, part, addressFor) => {
      const document = given.documents?.[`${chapterId}:${part.toString()}`];

      return Promise.resolve(
        document === undefined ? null : document.replace('{picture}', addressFor('picture.png')),
      );
    },

    readResource: (chapterId) =>
      Promise.resolve(chapterOf(chapterId)?.format === 'epub' ? bytes : null),

    readCover: (bookId) =>
      Promise.resolve(given.books.some((book) => book.id === bookId) ? bytes : null),

    saveProgress: (profileId, chapterId, where) => {
      const chapter = chapterOf(chapterId);

      if (chapter === undefined || (where.pageNumber === null && where.fraction === null)) {
        return Promise.resolve(false);
      }

      const entry = {
        bookId: chapter.bookId,
        chapterId,
        pageNumber: where.pageNumber,
        fraction: where.fraction,
        isFinished: where.isFinished,
        updatedAt: new Date().toISOString(),
      };
      const at = progress.findIndex(
        (one) => one.profileId === profileId && one.entry.chapterId === chapterId,
      );

      if (at === -1) {
        progress.push({ profileId, entry });
      } else {
        progress[at] = { profileId, entry };
      }

      return Promise.resolve(true);
    },

    readProgress: (profileId, bookId) =>
      Promise.resolve(
        progress
          .filter((one) => one.profileId === profileId && one.entry.bookId === bookId)
          .map((one) => one.entry),
      ),
  };
};

export { createMemoryBookService };
