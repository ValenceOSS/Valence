import { and, eq, exists, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { mediaItem, musicAlbum, musicTrack } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import { isStillThere } from '@ValenceServer/visibility/isStillThere';

/**
 * Whether an album still has a track in its library, since one whose every track has gone missing
 * is kept a while for what listeners have of it but is no longer held.
 *
 * @param db - The database the condition is built for.
 * @returns The condition, on the album table.
 */
const albumHasSomethingStillThere = (db: AnyValenceDatabase): SQL =>
  exists(
    db
      .select({ one: sql`1` })
      .from(musicTrack)
      .innerJoin(mediaItem, eq(mediaItem.id, musicTrack.mediaItemId))
      .where(and(eq(musicTrack.albumId, musicAlbum.id), isStillThere())),
  );

export { albumHasSomethingStillThere };
