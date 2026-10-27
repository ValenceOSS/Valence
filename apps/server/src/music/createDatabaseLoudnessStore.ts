import { and, eq, inArray, isNull, notLike } from 'drizzle-orm';
import { mediaItem, musicTrack } from '#dialect/Schema';
import { LINKED_SCHEME } from '@ValenceServer/linking/catalogue/LINKED_SCHEME';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { AlbumToLevel, LoudnessStore } from '@ValenceServer/music/measureWaitingLoudness';

/**
 * Keeps how loud each song is in the music library: which songs are still waiting to be measured,
 * what each measured at, and the album gain worked out once all of an album's songs are known.
 * Songs from a linked server are left alone, since their files are not here to be heard, and an
 * album is levelled from the songs that are here.
 *
 * @param db - The database.
 * @returns The store.
 */
const createDatabaseLoudnessStore = (db: AnyValenceDatabase): LoudnessStore => ({
  waiting: async () =>
    db
      .select({ id: mediaItem.id, path: mediaItem.path })
      .from(musicTrack)
      .innerJoin(mediaItem, eq(mediaItem.id, musicTrack.mediaItemId))
      .where(
        and(
          isNull(musicTrack.trackGainDb),
          isNull(musicTrack.loudnessTriedAt),
          notLike(mediaItem.path, `${LINKED_SCHEME}%`),
        ),
      )
      .orderBy(musicTrack.albumId),

  keepMeasured: async (trackId, measured, now) => {
    await db
      .update(musicTrack)
      .set({
        loudnessTriedAt: now,
        ...(measured === null
          ? {}
          : { trackGainDb: measured.trackGainDb, trackPeak: measured.trackPeak }),
      })
      .where(eq(musicTrack.mediaItemId, trackId));
  },

  albumsToLevel: async () => {
    const lacking = db
      .select({ albumId: musicTrack.albumId })
      .from(musicTrack)
      .where(isNull(musicTrack.albumGainDb));
    const rows = await db
      .select({
        albumId: musicTrack.albumId,
        durationSeconds: mediaItem.durationSeconds,
        trackGainDb: musicTrack.trackGainDb,
        trackPeak: musicTrack.trackPeak,
      })
      .from(musicTrack)
      .innerJoin(mediaItem, eq(mediaItem.id, musicTrack.mediaItemId))
      .where(
        and(inArray(musicTrack.albumId, lacking), notLike(mediaItem.path, `${LINKED_SCHEME}%`)),
      );
    const albums = new Map<string, AlbumToLevel | null>();

    for (const row of rows) {
      const held = albums.get(row.albumId);

      if (held === null) {
        continue;
      }

      if (row.trackGainDb === null) {
        albums.set(row.albumId, null);

        continue;
      }

      const track = {
        durationSeconds: row.durationSeconds,
        trackGainDb: row.trackGainDb,
        trackPeak: row.trackPeak,
      };

      albums.set(
        row.albumId,
        held === undefined
          ? { albumId: row.albumId, tracks: [track] }
          : { ...held, tracks: [...held.tracks, track] },
      );
    }

    return [...albums.values()].flatMap((album) => (album === null ? [] : [album]));
  },

  keepAlbum: async (albumId, gainDb, peak) => {
    await db
      .update(musicTrack)
      .set({ albumGainDb: gainDb, albumPeak: peak })
      .where(eq(musicTrack.albumId, albumId));
  },
});

export { createDatabaseLoudnessStore };
