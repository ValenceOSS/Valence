import { and, eq, sql } from 'drizzle-orm';
import { mediaItem, musicAlbum, musicTrack } from '@ValenceServer/db/Schema';
import type { ValenceDatabase } from '@ValenceServer/db/Database';
import type { RequestedAlbumStore } from '@ValenceServer/requests/albums/RequestedAlbumStore';

/**
 * The music library's albums, as a request for one is tied to what the library found: by the
 * MusicBrainz release group its tracks are tagged with, or by the folder it was filed into.
 *
 * @param db - The database.
 * @returns The store.
 */
const createDatabaseRequestedAlbumStore = (db: ValenceDatabase): RequestedAlbumStore => ({
  findByReleaseGroup: async (libraryId, releaseGroupId) => {
    const [found] = await db
      .select({ id: musicAlbum.id })
      .from(musicAlbum)
      .where(
        and(
          eq(musicAlbum.libraryId, libraryId),
          eq(musicAlbum.releaseGroupMusicbrainzId, releaseGroupId),
        ),
      )
      .limit(1);

    return found?.id ?? null;
  },

  findUnder: async (libraryId, folder) => {
    const within = `${folder.replace(/\/+$/, '')}/`;
    const [found] = await db
      .select({ id: musicTrack.albumId })
      .from(musicTrack)
      .innerJoin(mediaItem, eq(mediaItem.id, musicTrack.mediaItemId))
      .where(
        and(
          eq(mediaItem.libraryId, libraryId),
          sql`left(${mediaItem.path}, ${within.length}) = ${within}`,
        ),
      )
      .limit(1);

    return found?.id ?? null;
  },

  setReleaseGroup: async (albumId, releaseGroupId) => {
    await db
      .update(musicAlbum)
      .set({ releaseGroupMusicbrainzId: releaseGroupId })
      .where(eq(musicAlbum.id, albumId));
  },
});

export { createDatabaseRequestedAlbumStore };
