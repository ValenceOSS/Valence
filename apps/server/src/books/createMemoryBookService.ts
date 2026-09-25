import { isAudiobookFormat } from '@ValenceContracts/schemas/Book';
import { chapterHeardAt } from '@ValenceServer/books/chapterHeardAt';
import type {
  Book,
  BookChapter,
  BookContents,
  ListeningProgress,
  ReadingProgress,
} from '@ValenceContracts/schemas/Book';
import type { BookService } from './createDatabaseBookService';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

type MemoryBooks = {
  books: Book[];
  chapters: BookChapter[];
  contents?: Record<string, BookContents>;
  documents?: Record<string, string>;
  refuses?: (viewer: Viewer, book: Book) => boolean;
};

/**
 * A shelf held in memory, for tests of everything that reads a shelf without scanning one.
 *
 * It holds what it is given and nothing is ever drawn: a page, a picture and a cover each come back
 * as the same few bytes, since what a test wants to know is whether one was served, not what it
 * looked like. A part of a book is found by `chapterId:part`, and the address a picture is given is
 * written into it where it names `{picture}`. Whoever `refuses` says may not see a book cannot find
 * or open it.
 *
 * @param given - The books, their chapters, and what the ones that reflow hold.
 * @returns The shelf.
 */
const createMemoryBookService = (given: MemoryBooks): BookService => {
  const progress: { profileId: string; entry: ReadingProgress }[] = [];
  const listened: { profileId: string; entry: ListeningProgress }[] = [];
  const bytes = { bytes: new Uint8Array([1, 2, 3]), contentType: 'image/png' };
  const chapterOf = (chapterId: string) =>
    given.chapters.find((chapter) => chapter.id === chapterId);

  return {
    listStored: () => Promise.resolve([]),
    upsertBook: () => Promise.resolve(null),
    upsertChapter: () => Promise.resolve(),
    removeByPaths: () => Promise.resolve(0),
    markScanned: () => Promise.resolve(),
    listComicChapters: () => Promise.resolve([]),
    renameChapter: () => Promise.resolve(),

    find: (viewer, { libraryId, ids, search, limit }) => {
      const wanted = search?.trim().toLowerCase() ?? '';

      return Promise.resolve(
        given.books
          .filter(
            (book) =>
              (libraryId === undefined || book.libraryId === libraryId) &&
              (ids === undefined || ids.includes(book.id)) &&
              (wanted === '' ||
                book.title.toLowerCase().includes(wanted) ||
                (book.authors ?? []).some((name) => name.toLowerCase().includes(wanted))) &&
              !(given.refuses?.(viewer, book) ?? false),
          )
          .slice(0, limit),
      );
    },

    canReach: (viewer, bookId, chapterId) => {
      const book = given.books.find((one) => one.id === bookId);
      const chapter = chapterId === undefined ? undefined : chapterOf(chapterId);

      return Promise.resolve(
        book !== undefined &&
          (chapterId === undefined || chapter?.bookId === bookId) &&
          (viewer === null || !(given.refuses?.(viewer, book) ?? false)),
      );
    },

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

    listReading: (viewer, profileId, limit) =>
      Promise.resolve(
        progress
          .filter((one) => one.profileId === profileId)
          .flatMap(({ entry }) => {
            const book = given.books.find((one) => one.id === entry.bookId);
            const chapter = chapterOf(entry.chapterId);

            return book === undefined ||
              chapter === undefined ||
              (given.refuses?.(viewer, book) ?? false)
              ? []
              : [
                  {
                    book,
                    chapterId: entry.chapterId,
                    chapterTitle: chapter.title,
                    pageNumber: entry.pageNumber,
                    pageCount: chapter.pageCount,
                    fraction: entry.fraction,
                    isFinished: entry.isFinished,
                    updatedAt: entry.updatedAt,
                  },
                ];
          })
          .slice(0, limit),
      ),

    forgetReading: (profileId, bookId) => {
      for (let at = progress.length - 1; at >= 0; at -= 1) {
        const one = progress[at];

        if (one?.profileId === profileId && (bookId === undefined || one.entry.bookId === bookId)) {
          progress.splice(at, 1);
        }
      }

      return Promise.resolve();
    },

    readChapterFile: (chapterId) => {
      const chapter = chapterOf(chapterId);

      return Promise.resolve(
        chapter === undefined
          ? null
          : { path: `/books/${chapter.id}.${chapter.format}`, format: chapter.format },
      );
    },

    saveListening: (profileId, bookId, where) => {
      const chapter = chapterOf(where.chapterId);

      if (
        chapter === undefined ||
        chapter.bookId !== bookId ||
        !isAudiobookFormat(chapter.format)
      ) {
        return Promise.resolve(false);
      }

      const entry = {
        bookId,
        chapterId: where.chapterId,
        positionSeconds: where.positionSeconds,
        isFinished: where.isFinished,
        updatedAt: new Date().toISOString(),
      };
      const at = listened.findIndex(
        (one) => one.profileId === profileId && one.entry.bookId === bookId,
      );

      if (at === -1) {
        listened.push({ profileId, entry });
      } else {
        listened[at] = { profileId, entry };
      }

      return Promise.resolve(true);
    },

    readListening: (profileId, bookId) =>
      Promise.resolve(
        listened.find((one) => one.profileId === profileId && one.entry.bookId === bookId)?.entry ??
          null,
      ),

    listListening: (viewer, profileId, limit) =>
      Promise.resolve(
        listened
          .filter((one) => one.profileId === profileId)
          .flatMap(({ entry }) => {
            const book = given.books.find((one) => one.id === entry.bookId);
            const tracks = given.chapters.filter(
              (chapter) => chapter.bookId === entry.bookId && isAudiobookFormat(chapter.format),
            );
            const at = tracks.findIndex((chapter) => chapter.id === entry.chapterId);
            const lengthOf = (chapter: BookChapter) => chapter.durationSeconds ?? 0;

            return book === undefined || at === -1 || (given.refuses?.(viewer, book) ?? false)
              ? []
              : [
                  {
                    book,
                    chapterId: entry.chapterId,
                    chapterTitle: chapterHeardAt(
                      tracks[at]?.title ?? '',
                      tracks[at]?.marks ?? [],
                      entry.positionSeconds,
                    ),
                    positionSeconds: entry.positionSeconds,
                    heardSeconds:
                      tracks.slice(0, at).reduce((all, chapter) => all + lengthOf(chapter), 0) +
                      entry.positionSeconds,
                    durationSeconds: tracks.reduce((all, chapter) => all + lengthOf(chapter), 0),
                    isFinished: entry.isFinished,
                    updatedAt: entry.updatedAt,
                  },
                ];
          })
          .slice(0, limit),
      ),

    forgetListening: (profileId, bookId) => {
      for (let at = listened.length - 1; at >= 0; at -= 1) {
        const one = listened[at];

        if (one?.profileId === profileId && (bookId === undefined || one.entry.bookId === bookId)) {
          listened.splice(at, 1);
        }
      }

      return Promise.resolve();
    },
  };
};

export { createMemoryBookService };
