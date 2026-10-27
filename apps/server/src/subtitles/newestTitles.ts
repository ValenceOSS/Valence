import { isStillThere } from '@ValenceServer/visibility/isStillThere';
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { library, mediaItem } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';

/**
 * The newest films and episodes, newest first, leaving out extras, music and books: the titles
 * subtitles are looked for and written for.
 *
 * @param db - The database.
 * @param limit - How many to take.
 * @returns Their ids.
 */
const newestTitles = async (db: AnyValenceDatabase, limit: number): Promise<string[]> =>
  (
    await db
      .select({ id: mediaItem.id })
      .from(mediaItem)
      .innerJoin(library, eq(library.id, mediaItem.libraryId))
      .where(
        and(
          inArray(library.kind, ['movies', 'shows']),
          eq(library.isStreamed, false),
          isNull(mediaItem.extraKind),
          isStillThere(),
        ),
      )
      .orderBy(desc(mediaItem.addedAt))
      .limit(limit)
  ).map((row) => row.id);

export { newestTitles };
