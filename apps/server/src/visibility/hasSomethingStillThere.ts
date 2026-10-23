import { and, eq, exists, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { mediaItem, series } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import { isStillThere } from '@ValenceServer/visibility/isStillThere';

/**
 * Whether a programme still has a file in its library, since one whose every episode has gone
 * missing is kept a while for what viewers have of it but is no longer held.
 *
 * @param db - The database the condition is built for.
 * @returns The condition, on the programme table.
 */
const hasSomethingStillThere = (db: AnyValenceDatabase): SQL =>
  exists(
    db
      .select({ one: sql`1` })
      .from(mediaItem)
      .where(and(eq(mediaItem.seriesId, series.id), isStillThere())),
  );

export { hasSomethingStillThere };
