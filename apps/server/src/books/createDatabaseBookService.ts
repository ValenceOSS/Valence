import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { and, asc, count, desc, eq, ilike, inArray, max, or, sql } from 'drizzle-orm';
import { book, bookChapter, library, readingProgress } from '@ValenceServer/db/Schema';
import { z } from 'zod';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import {
  BookFormatSchema,
  BookLayoutSchema,
  ReadingDirectionSchema,
} from '@ValenceContracts/schemas/Book';
import { createBookPageCache } from './createBookPageCache';
import { drawBookCover } from './drawBookCover';
import { openBookFile } from './openBookFile';
import type { ValenceDatabase } from '@ValenceServer/db/Database';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type {
  Book,
  BookDetail,
  BookContents,
  BookReading,
  ReadingProgress,
  SaveReadingProgress,
} from '@ValenceContracts/schemas/Book';
import type { BookPageBytes } from './BookFile';
import type { BookStore } from './scanBookLibrary';
import { booksVisibleToViewer } from '@ValenceServer/visibility/booksVisibleToViewer';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

const FIND_LIMIT = 500;

const COVER_WIDTH = 640;

type BookQuery = {
  libraryId?: string;
  ids?: readonly string[];
  search?: string;
  limit?: number;
};

type BookService = BookStore & {
  find: (viewer: Viewer, query: BookQuery) => Promise<Book[]>;
  canReach: (viewer: Viewer | null, bookId: string, chapterId?: string) => Promise<boolean>;
  read: (bookId: string) => Promise<BookDetail | null>;
  readPage: (chapterId: string, page: number, width?: number) => Promise<BookPageBytes | null>;
  readContents: (chapterId: string) => Promise<BookContents | null>;
  readDocument: (
    chapterId: string,
    part: number,
    addressFor: (href: string) => string,
  ) => Promise<string | null>;
  readResource: (chapterId: string, href: string) => Promise<BookPageBytes | null>;
  readCover: (bookId: string) => Promise<BookPageBytes | null>;
  saveProgress: (
    profileId: string,
    chapterId: string,
    where: SaveReadingProgress,
  ) => Promise<boolean>;
  readProgress: (profileId: string, bookId: string) => Promise<ReadingProgress[]>;
  listReading: (viewer: Viewer, profileId: string, limit: number) => Promise<BookReading[]>;
  forgetReading: (profileId: string, bookId?: string) => Promise<void>;
};

const NamesSchema = z.array(z.string()).nullable().catch(null);

/**
 * Reads a list of names out of whatever the database gave back for a JSON column.
 *
 * A JSON column is whatever was put in it, which is not a thing the database will vouch for, so it
 * is read through a schema rather than trusted to be what it was when it was written.
 *
 * @param held - What was stored.
 * @returns The names, or nothing where what was stored was not a list of them.
 */
const namesIn = (held: JsonValue): string[] | null => NamesSchema.parse(held);

/**
 * A book as a shelf shows it, from its row and how many chapters it has.
 *
 * @param row - The book as stored.
 * @param chapterCount - How many chapters are in it.
 * @returns The book.
 */
const toBook = (row: typeof book.$inferSelect, chapterCount: number): Book => ({
  id: row.id,
  libraryId: row.libraryId,
  title: row.title,
  layout: BookLayoutSchema.catch('fixed').parse(row.layout),
  direction: ReadingDirectionSchema.catch('leftToRight').parse(row.direction),
  year: row.year,
  overview: row.overview,
  genres: namesIn(JsonValueSchema.catch(null).parse(row.genres ?? null)),
  authors: namesIn(JsonValueSchema.catch(null).parse(row.authors ?? null)),
  rating: row.rating,
  posterUrl: row.posterUrl,
  hasCover: chapterCount > 0,
  chapterCount,
  addedAt: row.addedAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

/**
 * The shelf: what is on it, what is inside each thing on it, and where everybody is up to.
 *
 * Pages are kept once they have been drawn, under `books/` beside the artwork, and the job that
 * tidies the artwork away tidies these too. A cover is drawn at the width a rail shows it, rather
 * than as the megabytes of first page it is.
 *
 * @param db - The database.
 * @param cacheDir - Where pages are kept once they have been read.
 * @returns The service, which the scan writes through and the routes read through.
 */
const createDatabaseBookService = (db: ValenceDatabase, cacheDir: string): BookService => {
  const chapterFor = async (chapterId: string) => {
    const [found] = await db
      .select({
        id: bookChapter.id,
        path: bookChapter.path,
        bookId: bookChapter.bookId,
        format: bookChapter.format,
      })
      .from(bookChapter)
      .where(eq(bookChapter.id, chapterId))
      .limit(1);

    return found ?? null;
  };

  const pageOf = createBookPageCache({
    directory: join(cacheDir, 'books'),
    openPage: async (chapterId, page) => {
      const chapter = await chapterFor(chapterId);
      const opened = chapter === null ? null : await openBookFile(chapter.path).catch(() => null);

      return opened === null || opened.layout !== 'fixed' ? null : opened.readPage(page);
    },
  });

  const service: BookService = {
    listStored: async (libraryId) => {
      const rows = await db
        .select({
          path: bookChapter.path,
          sizeBytes: bookChapter.sizeBytes,
          modifiedAtMs: bookChapter.modifiedAtMs,
        })
        .from(bookChapter)
        .innerJoin(book, eq(book.id, bookChapter.bookId))
        .where(eq(book.libraryId, libraryId));

      return rows;
    },

    upsertBook: async (row) => {
      const [saved] = await db
        .insert(book)
        .values({
          id: randomUUID(),
          libraryId: row.libraryId,
          path: row.path,
          title: row.title,
          layout: row.layout,
          direction: row.direction,
          year: row.year,
          authors: row.authors.length === 0 ? null : row.authors,
          overview: row.overview,
        })
        .onConflictDoUpdate({
          target: [book.libraryId, book.path],
          set: {
            title: row.title,
            layout: row.layout,
            year: row.year,
            updatedAt: new Date(),
            ...(row.authors.length === 0 ? {} : { authors: row.authors }),
            ...(row.overview === null ? {} : { overview: row.overview }),
          },
        })
        .returning({ id: book.id });

      return saved?.id ?? null;
    },

    upsertChapter: async (libraryId, row) => {
      const [owner] = await db
        .select({ id: book.id })
        .from(book)
        .where(and(eq(book.libraryId, libraryId), eq(book.path, row.bookPath)))
        .limit(1);

      if (owner === undefined) {
        return;
      }

      await db
        .insert(bookChapter)
        .values({
          id: randomUUID(),
          bookId: owner.id,
          path: row.path,
          number: row.number,
          title: row.title,
          format: row.format,
          pageCount: row.pageCount,
          sizeBytes: row.sizeBytes,
          modifiedAtMs: row.modifiedAtMs,
        })
        .onConflictDoUpdate({
          target: [bookChapter.bookId, bookChapter.path],
          set: {
            number: row.number,
            title: row.title,
            format: row.format,
            pageCount: row.pageCount,
            sizeBytes: row.sizeBytes,
            modifiedAtMs: row.modifiedAtMs,
          },
        });
    },

    removeByPaths: async (libraryId, paths) => {
      if (paths.length === 0) {
        return 0;
      }

      const owned = await db
        .select({ id: bookChapter.id })
        .from(bookChapter)
        .innerJoin(book, eq(book.id, bookChapter.bookId))
        .where(and(eq(book.libraryId, libraryId), inArray(bookChapter.path, paths)));

      if (owned.length === 0) {
        return 0;
      }

      await db.delete(bookChapter).where(
        inArray(
          bookChapter.id,
          owned.map((row) => row.id),
        ),
      );

      return owned.length;
    },

    markScanned: async (libraryId) => {
      await db.update(library).set({ lastScannedAt: new Date() }).where(eq(library.id, libraryId));
    },

    find: async (viewer, { libraryId, ids, search, limit = FIND_LIMIT }) => {
      if (ids?.length === 0) {
        return [];
      }

      const like = search === undefined || search.trim() === '' ? null : `%${search.trim()}%`;
      const rows = await db
        .select()
        .from(book)
        .where(
          and(
            libraryId === undefined ? undefined : eq(book.libraryId, libraryId),
            ids === undefined ? undefined : inArray(book.id, [...ids]),
            like === null
              ? undefined
              : or(
                  ilike(book.title, like),
                  ilike(book.overview, like),
                  sql`${book.authors}::text ilike ${like}`,
                ),
            booksVisibleToViewer(db, viewer),
          ),
        )
        .orderBy(asc(book.title))
        .limit(limit);

      const counted =
        rows.length === 0
          ? []
          : await db
              .select({ bookId: bookChapter.bookId, count: count() })
              .from(bookChapter)
              .where(
                inArray(
                  bookChapter.bookId,
                  rows.map((row) => row.id),
                ),
              )
              .groupBy(bookChapter.bookId);

      const howMany = new Map(counted.map((row) => [row.bookId, row.count]));

      return rows.map((row) => toBook(row, howMany.get(row.id) ?? 0));
    },

    canReach: async (viewer, bookId, chapterId) => {
      if (chapterId !== undefined) {
        const chapter = await chapterFor(chapterId);

        if (chapter === null || chapter.bookId !== bookId) {
          return false;
        }
      }

      if (viewer === null) {
        return true;
      }

      const [found] = await db
        .select({ id: book.id })
        .from(book)
        .where(and(eq(book.id, bookId), booksVisibleToViewer(db, viewer)))
        .limit(1);

      return found !== undefined;
    },

    read: async (bookId) => {
      const [row] = await db.select().from(book).where(eq(book.id, bookId)).limit(1);

      if (row === undefined) {
        return null;
      }

      const chapters = await db
        .select()
        .from(bookChapter)
        .where(eq(bookChapter.bookId, bookId))
        .orderBy(asc(bookChapter.number));

      return {
        book: toBook(row, chapters.length),
        chapters: chapters.map((chapter) => ({
          id: chapter.id,
          bookId: chapter.bookId,
          number: chapter.number,
          title: chapter.title,
          format: BookFormatSchema.catch('cbz').parse(chapter.format),
          pageCount: chapter.pageCount,
          addedAt: chapter.addedAt.toISOString(),
        })),
      };
    },

    readPage: pageOf,

    readContents: async (chapterId) => {
      const chapter = await chapterFor(chapterId);
      const opened = chapter === null ? null : await openBookFile(chapter.path).catch(() => null);

      return opened === null || opened.layout !== 'reflow'
        ? null
        : {
            parts: opened.spine.map((part) => ({ size: part.size })),
            contents: await opened.readContents(),
          };
    },

    readDocument: async (chapterId, part, addressFor) => {
      const chapter = await chapterFor(chapterId);
      const opened =
        chapter === null ? null : await openBookFile(chapter.path, addressFor).catch(() => null);

      return opened === null || opened.layout !== 'reflow' ? null : opened.readDocument(part);
    },

    readResource: async (chapterId, href) => {
      const chapter = await chapterFor(chapterId);
      const opened = chapter === null ? null : await openBookFile(chapter.path).catch(() => null);

      return opened === null || opened.layout !== 'reflow' ? null : opened.readResource(href);
    },

    readCover: async (bookId) => {
      const [first] = await db
        .select({ id: bookChapter.id, path: bookChapter.path, format: bookChapter.format })
        .from(bookChapter)
        .where(eq(bookChapter.bookId, bookId))
        .orderBy(asc(bookChapter.number))
        .limit(1);

      if (first === undefined) {
        return null;
      }

      if (first.format !== 'epub') {
        return pageOf(first.id, 0, COVER_WIDTH);
      }

      const opened = await openBookFile(first.path).catch(() => null);
      const cover = opened?.layout === 'reflow' ? await opened.readCover() : null;

      return cover === null ? null : drawBookCover(cover, COVER_WIDTH);
    },

    saveProgress: async (profileId, chapterId, where) => {
      const chapter = await chapterFor(chapterId);

      if (chapter === null || (where.pageNumber === null && where.fraction === null)) {
        return false;
      }

      await db
        .insert(readingProgress)
        .values({
          id: randomUUID(),
          profileId,
          bookId: chapter.bookId,
          chapterId,
          pageNumber: where.pageNumber,
          fraction: where.fraction,
          isFinished: where.isFinished,
        })
        .onConflictDoUpdate({
          target: [readingProgress.profileId, readingProgress.chapterId],
          set: {
            pageNumber: where.pageNumber,
            fraction: where.fraction,
            isFinished: where.isFinished,
            updatedAt: new Date(),
          },
        });

      return true;
    },

    readProgress: async (profileId, bookId) => {
      const rows = await db
        .select()
        .from(readingProgress)
        .where(and(eq(readingProgress.profileId, profileId), eq(readingProgress.bookId, bookId)));

      return rows.map((row) => ({
        bookId: row.bookId,
        chapterId: row.chapterId,
        pageNumber: row.pageNumber,
        fraction: row.fraction,
        isFinished: row.isFinished,
        updatedAt: row.updatedAt.toISOString(),
      }));
    },

    listReading: async (viewer, profileId, limit) => {
      const latest = await db
        .selectDistinctOn([readingProgress.bookId], {
          bookId: readingProgress.bookId,
          chapterId: readingProgress.chapterId,
          chapterTitle: bookChapter.title,
          chapterNumber: bookChapter.number,
          pageCount: bookChapter.pageCount,
          pageNumber: readingProgress.pageNumber,
          fraction: readingProgress.fraction,
          isFinished: readingProgress.isFinished,
          updatedAt: readingProgress.updatedAt,
        })
        .from(readingProgress)
        .innerJoin(bookChapter, eq(bookChapter.id, readingProgress.chapterId))
        .where(eq(readingProgress.profileId, profileId))
        .orderBy(readingProgress.bookId, desc(readingProgress.updatedAt));

      const recent = [...latest]
        .sort((one, other) => other.updatedAt.getTime() - one.updatedAt.getTime())
        .slice(0, limit);

      if (recent.length === 0) {
        return [];
      }

      const books = await service.find(viewer, { ids: recent.map((row) => row.bookId) });
      const lastChapters = await db
        .select({ bookId: bookChapter.bookId, last: max(bookChapter.number) })
        .from(bookChapter)
        .where(
          inArray(
            bookChapter.bookId,
            recent.map((row) => row.bookId),
          ),
        )
        .groupBy(bookChapter.bookId);
      const lastOf = new Map(lastChapters.map((row) => [row.bookId, row.last]));
      const byId = new Map(books.map((one) => [one.id, one]));

      return recent.flatMap((row) => {
        const found = byId.get(row.bookId);

        return found === undefined
          ? []
          : [
              {
                book: found,
                chapterId: row.chapterId,
                chapterTitle: row.chapterTitle,
                pageNumber: row.pageNumber,
                pageCount: row.pageCount,
                fraction: row.fraction,
                isFinished: row.isFinished && lastOf.get(row.bookId) === row.chapterNumber,
                updatedAt: row.updatedAt.toISOString(),
              },
            ];
      });
    },

    forgetReading: async (profileId, bookId) => {
      await db
        .delete(readingProgress)
        .where(
          and(
            eq(readingProgress.profileId, profileId),
            bookId === undefined ? undefined : eq(readingProgress.bookId, bookId),
          ),
        );
    },
  };

  return service;
};

export type { BookQuery, BookService };

export { createDatabaseBookService };
