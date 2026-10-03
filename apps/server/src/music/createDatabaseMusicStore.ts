import { randomUUID } from 'node:crypto';
import { and, eq, inArray, isNotNull, isNull, notExists, sql } from 'drizzle-orm';
import {
  library,
  mediaItem,
  musicAlbum,
  musicArtist,
  musicTrack,
  musicTrackArtist,
} from '#dialect/Schema';
import { countAffected } from '@ValenceDatabase/countAffected';
import { insertUnlessPresent } from '@ValenceDatabase/insertUnlessPresent';
import { upsert } from '@ValenceDatabase/upsert';
import { nameKey } from './nameKey';
import { sortNameFor } from './sortNameFor';
import { isStillThere } from '@ValenceServer/music/isStillThere';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { MusicStore } from './scanMusicLibrary';
import type { EnrichingStore } from './web/EnrichingStore';
import type { AlbumCorrectingStore } from './web/AlbumCorrectingStore';

/**
 * Deletes the albums a scan left with no tracks and the artists left with neither an album nor a
 * credit, so removing a record from the disk takes it off every page it was on.
 *
 * @param db - The database.
 * @param libraryId - The library that was scanned.
 */
const pruneEmpty = async (db: AnyValenceDatabase, libraryId: string): Promise<void> => {
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
 * It also keeps what was found on the web for what the files left out, and remembers what has been
 * looked up so it is not asked about again. Words found on the web are kept through a rescan that
 * finds none in the file, rather than being wiped and fetched again.
 *
 * @param db - The database.
 * @returns The store.
 */
const createDatabaseMusicStore = (
  db: AnyValenceDatabase,
): MusicStore & EnrichingStore & AlbumCorrectingStore => ({
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

    await insertUnlessPresent(db, musicArtist, {
      values: [
        {
          id: randomUUID(),
          libraryId,
          name: name.trim(),
          nameKey: key,
          sortName: sortNameFor(name),
          musicbrainzId,
        },
      ],
      target: [musicArtist.libraryId, musicArtist.nameKey],
    });

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
        .select({
          id: musicAlbum.id,
          artworkPath: musicAlbum.artworkPath,
          isCorrected: musicAlbum.isCorrected,
        })
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
      const learnt = {
        ...(row.year === null ? {} : { year: row.year }),
        ...(row.genres.length === 0 ? {} : { genres: row.genres }),
        ...(row.musicbrainzId === null || known.isCorrected
          ? {}
          : { musicbrainzId: row.musicbrainzId }),
        ...(row.releaseGroupMusicbrainzId === null || known.isCorrected
          ? {}
          : { releaseGroupMusicbrainzId: row.releaseGroupMusicbrainzId }),
        ...(row.isCompilation ? { isCompilation: true } : {}),
      };

      if (Object.keys(learnt).length > 0) {
        await db.update(musicAlbum).set(learnt).where(eq(musicAlbum.id, known.id));
      }

      return {
        id: known.id,
        hasArtwork: known.artworkPath !== null,
        isCorrected: known.isCorrected,
      };
    }

    await insertUnlessPresent(db, musicAlbum, {
      values: [
        {
          id: randomUUID(),
          libraryId: row.libraryId,
          artistId: row.artistId,
          title: row.title.trim(),
          titleKey: key,
          year: row.year,
          genres: row.genres,
          isCompilation: row.isCompilation,
          musicbrainzId: row.musicbrainzId,
          releaseGroupMusicbrainzId: row.releaseGroupMusicbrainzId,
        },
      ],
      target: [musicAlbum.libraryId, musicAlbum.artistId, musicAlbum.titleKey],
    });

    const [made] = await found();

    return {
      id: made?.id ?? '',
      hasArtwork: made?.artworkPath !== null && made?.artworkPath !== undefined,
      isCorrected: made?.isCorrected === true,
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

    await upsert(db, mediaItem, {
      values: [
        {
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
        },
      ],
      target: [mediaItem.libraryId, mediaItem.path],
      set: described,
    });

    const [saved] = await db
      .select({ id: mediaItem.id })
      .from(mediaItem)
      .where(and(eq(mediaItem.libraryId, row.libraryId), eq(mediaItem.path, row.path)));

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
      lyricsModifiedAtMs: row.lyricsModifiedAtMs,
    };

    const ownLyrics = {
      lyrics: row.lyrics,
      lyricsAreSynced: row.lyrics !== null && /\[\d{1,3}:\d{1,2}/.test(row.lyrics),
    };

    const keptLyrics =
      row.lyrics === null
        ? {
            lyrics: sql<
              string | null
            >`case when ${musicTrack.lyricsLookedUpAt} is not null then ${musicTrack.lyrics} else null end`,
            lyricsAreSynced: sql<boolean>`case when ${musicTrack.lyricsLookedUpAt} is not null then ${musicTrack.lyricsAreSynced} else false end`,
          }
        : ownLyrics;

    await upsert(db, musicTrack, {
      values: [{ mediaItemId: saved.id, ...music, ...ownLyrics }],
      target: musicTrack.mediaItemId,
      set: { ...music, ...keptLyrics },
    });

    await db.delete(musicTrackArtist).where(eq(musicTrackArtist.mediaItemId, saved.id));

    await insertUnlessPresent(db, musicTrackArtist, {
      values: row.artistIds.map((artistId, position) => ({
        mediaItemId: saved.id,
        artistId,
        position,
      })),
      target: [musicTrackArtist.mediaItemId, musicTrackArtist.artistId],
    });
  },

  forgetMissingArtwork: async (libraryId) => {
    const albums = await db
      .select({ id: musicAlbum.id, artistId: musicAlbum.artistId, path: musicAlbum.artworkPath })
      .from(musicAlbum)
      .where(and(eq(musicAlbum.libraryId, libraryId), isNotNull(musicAlbum.artworkPath)));
    const artists = await db
      .select({ id: musicArtist.id, path: musicArtist.imagePath })
      .from(musicArtist)
      .where(and(eq(musicArtist.libraryId, libraryId), isNotNull(musicArtist.imagePath)));
    const lostAlbums: string[] = [];
    const lostArtists = new Set<string>();

    for (const album of albums) {
      if (!(await isStillThere(album.path ?? ''))) {
        lostAlbums.push(album.id);
      }
    }

    for (const artist of artists) {
      if (!(await isStillThere(artist.path ?? ''))) {
        lostArtists.add(artist.id);
      }
    }

    if (lostAlbums.length > 0) {
      await db
        .update(musicAlbum)
        .set({ artworkPath: null, lookedUpAt: null })
        .where(inArray(musicAlbum.id, lostAlbums));
    }

    if (lostArtists.size > 0) {
      await db
        .update(musicArtist)
        .set({ imagePath: null, lookedUpAt: null })
        .where(inArray(musicArtist.id, [...lostArtists]));
    }

    const theirAlbums =
      lostArtists.size === 0
        ? []
        : await db
            .select({ id: musicAlbum.id })
            .from(musicAlbum)
            .where(inArray(musicAlbum.artistId, [...lostArtists]));
    const wanted = [...new Set([...lostAlbums, ...theirAlbums.map((album) => album.id)])];

    if (wanted.length === 0) {
      return [];
    }

    const tracks = await db
      .select({ path: mediaItem.path })
      .from(musicTrack)
      .innerJoin(mediaItem, eq(mediaItem.id, musicTrack.mediaItemId))
      .where(inArray(musicTrack.albumId, wanted));

    return tracks.map((track) => track.path);
  },

  correctAlbum: async (albumId, releaseGroupId, artworkPath) => {
    const changed = await db
      .update(musicAlbum)
      .set({
        releaseGroupMusicbrainzId: releaseGroupId,
        musicbrainzId: null,
        isCorrected: true,
        lookedUpAt: new Date(),
        ...(artworkPath === null ? {} : { artworkPath }),
      })
      .where(eq(musicAlbum.id, albumId));

    return countAffected(changed) > 0;
  },

  forgetAlbumCorrection: async (albumId) => {
    const changed = await db
      .update(musicAlbum)
      .set({ isCorrected: false, artworkPath: null, lookedUpAt: null })
      .where(eq(musicAlbum.id, albumId));

    return countAffected(changed) > 0;
  },

  setAlbumArtwork: async (albumId, path) => {
    await db.update(musicAlbum).set({ artworkPath: path }).where(eq(musicAlbum.id, albumId));
  },

  setArtistImage: async (artistId, path) => {
    await db.update(musicArtist).set({ imagePath: path }).where(eq(musicArtist.id, artistId));
  },

  picturesKept: async (libraryId) => {
    const albums = await db
      .select({ id: musicAlbum.id, path: musicAlbum.artworkPath })
      .from(musicAlbum)
      .where(and(eq(musicAlbum.libraryId, libraryId), isNotNull(musicAlbum.artworkPath)));
    const artists = await db
      .select({ id: musicArtist.id, path: musicArtist.imagePath })
      .from(musicArtist)
      .where(and(eq(musicArtist.libraryId, libraryId), isNotNull(musicArtist.imagePath)));

    return [
      ...albums.flatMap((row) =>
        row.path === null ? [] : [{ kind: 'album' as const, id: row.id, path: row.path }],
      ),
      ...artists.flatMap((row) =>
        row.path === null ? [] : [{ kind: 'artist' as const, id: row.id, path: row.path }],
      ),
    ];
  },

  forgetPicture: async (kind, id) => {
    if (kind === 'album') {
      await db
        .update(musicAlbum)
        .set({ artworkPath: null, lookedUpAt: null })
        .where(eq(musicAlbum.id, id));

      return;
    }

    await db
      .update(musicArtist)
      .set({ imagePath: null, lookedUpAt: null })
      .where(eq(musicArtist.id, id));
  },

  removeByPaths: async (libraryId, paths) => {
    if (paths.length === 0) {
      return 0;
    }

    const removed = await db
      .delete(mediaItem)
      .where(and(eq(mediaItem.libraryId, libraryId), inArray(mediaItem.path, paths)));

    return countAffected(removed);
  },

  prune: (libraryId) => pruneEmpty(db, libraryId),

  markScanned: async (libraryId) => {
    await db.update(library).set({ lastScannedAt: new Date() }).where(eq(library.id, libraryId));
  },

  albumsToLookUp: async (libraryId, isAgain) =>
    db
      .select({
        id: musicAlbum.id,
        title: musicAlbum.title,
        artistName: musicArtist.name,
        musicbrainzId: musicAlbum.musicbrainzId,
      })
      .from(musicAlbum)
      .innerJoin(musicArtist, eq(musicArtist.id, musicAlbum.artistId))
      .where(
        and(
          eq(musicAlbum.libraryId, libraryId),
          isNull(musicAlbum.artworkPath),
          isAgain ? undefined : isNull(musicAlbum.lookedUpAt),
        ),
      ),

  markAlbumLookedUp: async (albumId) => {
    await db.update(musicAlbum).set({ lookedUpAt: new Date() }).where(eq(musicAlbum.id, albumId));
  },

  artistsToLookUp: async (libraryId, isAgain) =>
    db
      .select({
        id: musicArtist.id,
        name: musicArtist.name,
        hasImage: sql<boolean>`${musicArtist.imagePath} is not null`,
      })
      .from(musicArtist)
      .where(
        and(
          eq(musicArtist.libraryId, libraryId),
          isAgain ? undefined : isNull(musicArtist.lookedUpAt),
        ),
      ),

  markArtistLookedUp: async (artistId) => {
    await db
      .update(musicArtist)
      .set({ lookedUpAt: new Date() })
      .where(eq(musicArtist.id, artistId));
  },

  songsBy: async (artistId) =>
    db
      .select({ id: mediaItem.id, title: mediaItem.title })
      .from(musicTrackArtist)
      .innerJoin(mediaItem, eq(mediaItem.id, musicTrackArtist.mediaItemId))
      .where(eq(musicTrackArtist.artistId, artistId)),

  setVideo: async (trackId, videoKey) => {
    await db.update(musicTrack).set({ videoKey }).where(eq(musicTrack.mediaItemId, trackId));
  },

  songsWithoutLyrics: async (libraryId, isAgain) =>
    db
      .select({
        id: mediaItem.id,
        title: mediaItem.title,
        durationSeconds: mediaItem.durationSeconds,
        albumTitle: musicAlbum.title,
        artistName: sql<string>`coalesce((select ${musicArtist.name} from ${musicTrackArtist} join ${musicArtist} on ${musicArtist.id} = ${musicTrackArtist.artistId} where ${musicTrackArtist.mediaItemId} = ${mediaItem.id} order by ${musicTrackArtist.position} limit 1), '')`,
      })
      .from(musicTrack)
      .innerJoin(mediaItem, eq(mediaItem.id, musicTrack.mediaItemId))
      .innerJoin(musicAlbum, eq(musicAlbum.id, musicTrack.albumId))
      .where(
        and(
          eq(mediaItem.libraryId, libraryId),
          isNull(musicTrack.lyrics),
          isAgain ? undefined : isNull(musicTrack.lyricsLookedUpAt),
        ),
      ),

  keepFoundLyrics: async (trackId, lyrics) => {
    await db
      .update(musicTrack)
      .set({
        lyricsLookedUpAt: new Date(),
        ...(lyrics === null ? {} : { lyrics, lyricsAreSynced: /\[\d{1,3}:\d{1,2}/.test(lyrics) }),
      })
      .where(eq(musicTrack.mediaItemId, trackId));
  },
});

export { createDatabaseMusicStore };
