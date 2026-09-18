import { eq, notExists, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { mediaItem, musicTrack } from '@ValenceServer/db/Schema';
import type { ValenceDatabase } from '@ValenceServer/db/Database';

/**
 * A condition that holds for every media item that is not a song.
 *
 * A track is a media item so that favourites, playlists and hiding work on it the same as on a film,
 * but nearly everything else that reads media items is about watching: the shelves, the facets,
 * previews and thumbnails. Those leave tracks out with this, and music is read through its own pages.
 *
 * @param db - The database the condition is built against.
 * @returns The condition, correlated on the media item being read.
 */
const isNotATrack = (db: ValenceDatabase): SQL =>
  notExists(
    db
      .select({ one: sql`1` })
      .from(musicTrack)
      .where(eq(musicTrack.mediaItemId, mediaItem.id)),
  );

export { isNotATrack };
