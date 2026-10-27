import { and, eq, exists, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { library, mediaItem } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';

/**
 * Whether a title is a film played straight from a source, kept in the hidden library streamed
 * films are kept in rather than in one of the server's own.
 *
 * @param db - The database the subquery is built against.
 * @returns The condition, over `media_item`.
 */
const isStreamedItem = (db: AnyValenceDatabase): SQL =>
  exists(
    db
      .select({ one: sql`1` })
      .from(library)
      .where(and(eq(library.id, mediaItem.libraryId), eq(library.isStreamed, true))),
  );

export { isStreamedItem };
