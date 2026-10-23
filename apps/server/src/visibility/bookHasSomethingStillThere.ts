import { and, eq, exists, isNull, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { book, bookChapter } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';

/**
 * Whether a book still has a chapter in its library, since one whose every chapter has gone missing
 * is kept a while for where its readers were but is no longer held.
 *
 * @param db - The database the condition is built for.
 * @returns The condition, on the book table.
 */
const bookHasSomethingStillThere = (db: AnyValenceDatabase): SQL =>
  exists(
    db
      .select({ one: sql`1` })
      .from(bookChapter)
      .where(and(eq(bookChapter.bookId, book.id), isNull(bookChapter.missingSince))),
  );

export { bookHasSomethingStillThere };
