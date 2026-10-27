import { and, eq, exists, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { favourite, mediaItem } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';

/**
 * A condition that holds for a song a profile liked, read from a query of media items.
 *
 * @param db - The database the subquery is built against.
 * @param profileId - Whose likes.
 * @returns The condition.
 */
const isLikedBy = (db: AnyValenceDatabase, profileId: string): SQL =>
  exists(
    db
      .select({ one: sql`1` })
      .from(favourite)
      .where(and(eq(favourite.mediaItemId, mediaItem.id), eq(favourite.profileId, profileId))),
  );

export { isLikedBy };
