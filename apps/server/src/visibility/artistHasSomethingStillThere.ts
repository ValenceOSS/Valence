import { and, eq, exists, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { mediaItem, musicAlbum, musicArtist, musicTrack, musicTrackArtist } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import { isStillThere } from '@ValenceServer/visibility/isStillThere';

/**
 * Whether an artist still has a track in their library, on an album of theirs or one they are
 * credited on, since one whose every track has gone missing is no longer held.
 *
 * @param db - The database the condition is built for.
 * @returns The condition, on the artist table.
 */
const artistHasSomethingStillThere = (db: AnyValenceDatabase): SQL =>
  or(
    exists(
      db
        .select({ one: sql`1` })
        .from(musicTrackArtist)
        .innerJoin(mediaItem, eq(mediaItem.id, musicTrackArtist.mediaItemId))
        .where(and(eq(musicTrackArtist.artistId, musicArtist.id), isStillThere())),
    ),
    exists(
      db
        .select({ one: sql`1` })
        .from(musicAlbum)
        .innerJoin(musicTrack, eq(musicTrack.albumId, musicAlbum.id))
        .innerJoin(mediaItem, eq(mediaItem.id, musicTrack.mediaItemId))
        .where(and(eq(musicAlbum.artistId, musicArtist.id), isStillThere())),
    ),
  ) ?? sql`false`;

export { artistHasSomethingStillThere };
