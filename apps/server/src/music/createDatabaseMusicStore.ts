import { randomUUID } from 'node:crypto';
import { and, eq, inArray, notExists, sql } from 'drizzle-orm';
import {
  library,
  mediaItem,
  musicAlbum,
  musicArtist,
  musicTrack,
  musicTrackArtist,
} from '@ValenceServer/db/Schema';
import { nameKey } from './nameKey';
import { sortNameFor } from './sortNameFor';
import type { ValenceDatabase } from '@ValenceServer/db/Database';
import type { MusicStore } from './scanMusicLibrary';

/**
 * Deletes the albums a scan left with no tracks and the artists left with neither an album nor a
 * credit, so removing a record from the disk takes it off every page it was on.
 *
 * @param db - The database.
 * @param libraryId - The library that was scanned.
 */
const pruneEmpty = async (db: ValenceDatabase, libraryId: string): Promise<void> => {
  await db.delete(musicAlbum).where(
    and(
      eq(musicAlbum.libraryId, libraryId),
      notExists(
        db
          .select({ one: sql`1` })
          .from(musicTrack)
          .where(eq(musicTrack.albumId, musicAlbum.id)),
      ),
    ),
  );

  await db.delete(musicArtist).where(
    and(
      eq(musicArtist.libraryId, libraryId),
      notExists(
        db
          .select({ one: sql`1` })
          .from(musicAlbum)
          .where(eq(musicAlbum.artistId, musicArtist.id)),
      ),
      notExists(
        db
          .select({ one: sql`1` })
          .from(musicTrackArtist)
          .where(eq(musicTrackArtist.artistId, musicArtist.id)),
      ),
    ),
  );
};

/**
 * Where a music scan writes: artists, albums and tracks, each found by what makes it the same one
 * again rather than inserted twice.
 *
 * A track is a media item like a film or an episode, with what only music has kept beside it. That
 * is what lets a favourite, a playlist, a hidden item or a blocked library work the same on a song as
 * on anything else, rather than music growing a copy of each. The video columns a media item needs
 * are written as what they are for a track — no video, no size.
 *
 * @param db - The database.
 * @returns The store.
 */
const createDatabaseMusicStore = (db: ValenceDatabase): MusicStore => ({
  listStored: (libraryId) =>
    db
      .select({
        path: mediaItem.path,
        sizeBytes: mediaItem.sizeBytes,
        modifiedAtMs: mediaItem.modifiedAtMs,
        lyricsModifiedAtMs: musicTrack.lyricsModifiedAtMs,
      })
      .from(mediaItem)
      .innerJoin(musicTrack, eq(musicTrack.mediaItemId, mediaItem.id))
      .where(eq(mediaItem.libraryId, libraryId)),

  keepArtist: async (libraryId, name, musicbrainzId) => {
    const key = nameKey(name);
    const found = () =>
      db
        .select({
          id: musicArtist.id,
          imagePath: musicArtist.imagePath,
          mbid: musicArtist.musicbrainzId,
        })
        .from(musicArtist)
        .where(and(eq(musicArtist.libraryId, libraryId), eq(musicArtist.nameKey, key)))
        .limit(1);

    const [known] = await found();

    if (known !== undefined) {
      if (known.mbid === null && musicbrainzId !== null) {
        await db.update(musicArtist).set({ musicbrainzId }).where(eq(musicArtist.id, known.id));
      }

      return { id: known.id, hasImage: known.imagePath !== null };
    }

    await db
      .insert(musicArtist)
      .values({
        id: randomUUID(),
        libraryId,
        name: name.trim(),
        nameKey: key,
        sortName: sortNameFor(name),
        musicbrainzId,
      })
      .onConflictDoNothing();

    const [made] = await found();

    return {
      id: made?.id ?? '',
      hasImage: made?.imagePath !== null && made?.imagePath !== undefined,
    };
  },

  keepAlbum: async (row) => {
    const key = nameKey(row.title);
    const found = () =>
      db
        .select({ id: musicAlbum.id, artworkPath: musicAlbum.artworkPath })
        .from(musicAlbum)
        .where(
          and(
            eq(musicAlbum.libraryId, row.libraryId),
            eq(musicAlbum.artistId, row.artistId),
            eq(musicAlbum.titleKey, key),
          ),
        )
        .limit(1);

    const [known] = await found();

    if (known !== undefined) {
      await db
        .update(musicAlbum)
        .set({
          ...(row.year === null ? {} : { year: row.year }),
          ...(row.genres.length === 0 ? {} : { genres: row.genres }),
          ...(row.musicbrainzId === null ? {} : { musicbrainzId: row.musicbrainzId }),
          ...(row.isCompilation ? { isCompilation: true } : {}),
        })
        .where(eq(musicAlbum.id, known.id));

      return { id: known.id, hasArtwork: known.artworkPath !== null };
    }

    await db
      .insert(musicAlbum)
      .values({
        id: randomUUID(),
        libraryId: row.libraryId,
        artistId: row.artistId,
        title: row.title.trim(),
        titleKey: key,
        year: row.year,
        genres: row.genres,
        isCompilation: row.isCompilation,
        musicbrainzId: row.musicbrainzId,
      })
      .onConflictDoNothing();

    const [made] = await found();

    return {
      id: made?.id ?? '',
      hasArtwork: made?.artworkPath !== null && made?.artworkPath !== undefined,
    };
  },

  keepTrack: async (row) => {
    const described = {
      title: row.title,
      year: row.year,
      sizeBytes: row.sizeBytes,
      modifiedAtMs: row.modifiedAtMs,
      container: row.container,
      durationSeconds: row.durationSeconds,
      bitrateKbps: row.bitrateKbps,
      genres: row.genres,
      updatedAt: new Date(),
    };

    const [saved] = await db
      .insert(mediaItem)
      .values({
        id: randomUUID(),
        libraryId: row.libraryId,
        path: row.path,
        ...described,
        videoCodec: 'none',
        videoRange: 'none',
        width: 0,
        height: 0,
        audioStreams: [],
        subtitleStreams: [],
      })
      .onConflictDoUpdate({ target: [mediaItem.libraryId, mediaItem.path], set: described })
      .returning({ id: mediaItem.id });

    if (saved === undefined) {
      return;
    }

    const music = {
      albumId: row.albumId,
      discNumber: row.discNumber,
      trackNumber: row.trackNumber,
      codec: row.codec,
      isLossless: row.isLossless,
      isExplicit: row.isExplicit,
      bitDepth: row.bitDepth,
      sampleRate: row.sampleRate,
      lyrics: row.lyrics,
      lyricsModifiedAtMs: row.lyricsModifiedAtMs,
      lyricsAreSynced: row.lyrics !== null && /\[\d{1,3}:\d{1,2}/.test(row.lyrics),
    };

    await db
      .insert(musicTrack)
      .values({ mediaItemId: saved.id, ...music })
      .onConflictDoUpdate({ target: musicTrack.mediaItemId, set: music });

    await db.delete(musicTrackArtist).where(eq(musicTrackArtist.mediaItemId, saved.id));

    await db
      .insert(musicTrackArtist)
      .values(
        row.artistIds.map((artistId, position) => ({ mediaItemId: saved.id, artistId, position })),
      )
      .onConflictDoNothing();
  },

  setAlbumArtwork: async (albumId, path) => {
    await db.update(musicAlbum).set({ artworkPath: path }).where(eq(musicAlbum.id, albumId));
  },

  setArtistImage: async (artistId, path) => {
    await db.update(musicArtist).set({ imagePath: path }).where(eq(musicArtist.id, artistId));
  },

  removeByPaths: async (libraryId, paths) => {
    if (paths.length === 0) {
      return 0;
    }

    const removed = await db
      .delete(mediaItem)
      .where(and(eq(mediaItem.libraryId, libraryId), inArray(mediaItem.path, paths)))
      .returning({ id: mediaItem.id });

    return removed.length;
  },

  prune: (libraryId) => pruneEmpty(db, libraryId),

  markScanned: async (libraryId) => {
    await db.update(library).set({ lastScannedAt: new Date() }).where(eq(library.id, libraryId));
  },
});

export { createDatabaseMusicStore };
