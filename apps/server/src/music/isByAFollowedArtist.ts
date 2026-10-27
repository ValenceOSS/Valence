import { and, eq, exists, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { favouriteArtist, mediaItem, musicTrackArtist } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';

/**
 * A condition that holds for a song credited to an artist a profile follows, read from a query of
 * media items.
 *
 * @param db - The database the subquery is built against.
 * @param profileId - Whose follows.
 * @returns The condition.
 */
const isByAFollowedArtist = (db: AnyValenceDatabase, profileId: string): SQL =>
  exists(
    db
      .select({ one: sql`1` })
      .from(musicTrackArtist)
      .innerJoin(favouriteArtist, eq(favouriteArtist.artistId, musicTrackArtist.artistId))
      .where(
        and(
          eq(musicTrackArtist.mediaItemId, mediaItem.id),
          eq(favouriteArtist.profileId, profileId),
        ),
      ),
  );

export { isByAFollowedArtist };
