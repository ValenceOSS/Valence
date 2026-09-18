import { and, asc, desc, eq, exists, ilike, inArray, isNotNull, ne, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { z } from 'zod';
import {
  favourite,
  favouriteArtist,
  library,
  mediaItem,
  musicAlbum,
  musicArtist,
  musicTrack,
  musicTrackArtist,
} from '@ValenceServer/db/Schema';
import { librariesVisibleToViewer } from '@ValenceServer/visibility/librariesVisibleToViewer';
import { visibleToViewer } from '@ValenceServer/visibility/visibleToViewer';
import { parseLyrics } from './parseLyrics';
import type { ValenceDatabase } from '@ValenceServer/db/Database';
import type { MusicAlbum, MusicArtist, MusicTrack } from '@ValenceContracts/schemas/Music';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import type { MusicService } from './MusicService';

const SEARCH_LIMIT = 20;

const POPULAR_LIMIT = 10;

const LIKED_LIMIT = 2000;

/**
 * The profile a viewer is acting as, where they are acting as one.
 *
 * @param viewer - Who is asking.
 * @returns Their profile, or nothing.
 */
const profileOf = (viewer: Viewer): string | null =>
  viewer.kind === 'account' ? viewer.profileId : null;

const NamesSchema = z.array(z.string()).catch([]);

/**
 * Artists, albums and tracks as a viewer is allowed to see them.
 *
 * Everything here reads through the same visibility the rest of the library does: a blocked library,
 * a hidden item or a hidden library leaves its music out as surely as it leaves out a film, and an
 * album or an artist appears only while something of theirs is still there to be seen.
 *
 * @param db - The database.
 * @returns The service the music routes read through.
 */
const createDatabaseMusicService = (db: ValenceDatabase): MusicService => {
  const trackVisible = (viewer: Viewer): SQL | undefined =>
    and(
      visibleToViewer(db, viewer),
      librariesVisibleToViewer(db, viewer),
      eq(library.kind, 'music'),
    );

  const albumHasVisibleTrack = (viewer: Viewer): SQL =>
    exists(
      db
        .select({ one: sql`1` })
        .from(musicTrack)
        .innerJoin(mediaItem, eq(mediaItem.id, musicTrack.mediaItemId))
        .where(and(eq(musicTrack.albumId, musicAlbum.id), visibleToViewer(db, viewer))),
    );

  const trackColumns = {
    id: mediaItem.id,
    libraryId: mediaItem.libraryId,
    title: mediaItem.title,
    durationSeconds: mediaItem.durationSeconds,
    bitrateKbps: mediaItem.bitrateKbps,
    discNumber: musicTrack.discNumber,
    trackNumber: musicTrack.trackNumber,
    codec: musicTrack.codec,
    isLossless: musicTrack.isLossless,
    bitDepth: musicTrack.bitDepth,
    sampleRate: musicTrack.sampleRate,
    hasLyrics: sql<boolean>`${musicTrack.lyrics} is not null`,
    albumId: musicAlbum.id,
    albumTitle: musicAlbum.title,
    albumHasArtwork: sql<boolean>`${musicAlbum.artworkPath} is not null`,
  };

  type TrackRow = {
    id: string;
    libraryId: string;
    title: string;
    durationSeconds: number;
    bitrateKbps: number | null;
    discNumber: number | null;
    trackNumber: number | null;
    codec: string;
    isLossless: boolean;
    bitDepth: number | null;
    sampleRate: number | null;
    hasLyrics: boolean;
    albumId: string;
    albumTitle: string;
    albumHasArtwork: boolean;
  };

  const dressTracks = async (viewer: Viewer, rows: TrackRow[]): Promise<MusicTrack[]> => {
    if (rows.length === 0) {
      return [];
    }

    const ids = rows.map((row) => row.id);
    const profileId = profileOf(viewer);

    const credits = await db
      .select({
        mediaItemId: musicTrackArtist.mediaItemId,
        id: musicArtist.id,
        name: musicArtist.name,
      })
      .from(musicTrackArtist)
      .innerJoin(musicArtist, eq(musicArtist.id, musicTrackArtist.artistId))
      .where(inArray(musicTrackArtist.mediaItemId, ids))
      .orderBy(asc(musicTrackArtist.position));

    const kept =
      profileId === null
        ? []
        : await db
            .select({ mediaItemId: favourite.mediaItemId })
            .from(favourite)
            .where(and(eq(favourite.profileId, profileId), inArray(favourite.mediaItemId, ids)));

    const liked = new Set(kept.map((row) => row.mediaItemId));
    const creditedTo = new Map<string, { id: string; name: string }[]>();

    for (const credit of credits) {
      creditedTo.set(credit.mediaItemId, [
        ...(creditedTo.get(credit.mediaItemId) ?? []),
        { id: credit.id, name: credit.name },
      ]);
    }

    return rows.map((row) => ({
      id: row.id,
      libraryId: row.libraryId,
      title: row.title,
      artists: creditedTo.get(row.id) ?? [],
      album: { id: row.albumId, title: row.albumTitle, hasArtwork: row.albumHasArtwork },
      discNumber: row.discNumber,
      trackNumber: row.trackNumber,
      durationSeconds: row.durationSeconds,
      codec: row.codec,
      isLossless: row.isLossless,
      bitDepth: row.bitDepth,
      sampleRate: row.sampleRate,
      bitrateKbps: row.bitrateKbps,
      hasLyrics: row.hasLyrics,
      isFavourite: liked.has(row.id),
    }));
  };

  const tracksWhere = async (
    viewer: Viewer,
    condition: SQL | undefined,
    order: SQL[],
    limit: number,
  ): Promise<MusicTrack[]> => {
    const rows = await db
      .select(trackColumns)
      .from(musicTrack)
      .innerJoin(mediaItem, eq(mediaItem.id, musicTrack.mediaItemId))
      .innerJoin(musicAlbum, eq(musicAlbum.id, musicTrack.albumId))
      .innerJoin(library, eq(library.id, mediaItem.libraryId))
      .where(and(condition, trackVisible(viewer)))
      .orderBy(...order)
      .limit(limit);

    return dressTracks(viewer, rows);
  };

  const inAlbumOrder = [
    asc(sql`coalesce(${musicTrack.discNumber}, 1)`),
    asc(sql`coalesce(${musicTrack.trackNumber}, 9999)`),
    asc(mediaItem.title),
  ];

  const albumColumns = {
    id: musicAlbum.id,
    libraryId: musicAlbum.libraryId,
    title: musicAlbum.title,
    year: musicAlbum.year,
    genres: musicAlbum.genres,
    isCompilation: musicAlbum.isCompilation,
    hasArtwork: sql<boolean>`${musicAlbum.artworkPath} is not null`,
    addedAt: musicAlbum.addedAt,
    artistId: musicArtist.id,
    artistName: musicArtist.name,
    trackCount: sql<number>`(select count(*)::int from ${musicTrack} where ${musicTrack.albumId} = ${musicAlbum.id})`,
    durationSeconds: sql<number>`(select coalesce(sum(m."durationSeconds"), 0)::float from ${musicTrack} t join ${mediaItem} m on m.id = t."mediaItemId" where t."albumId" = ${musicAlbum.id})`,
  };

  const albumsWhere = async (
    viewer: Viewer,
    condition: SQL | undefined,
    order: SQL[],
    limit: number,
  ): Promise<MusicAlbum[]> => {
    const rows = await db
      .select(albumColumns)
      .from(musicAlbum)
      .innerJoin(musicArtist, eq(musicArtist.id, musicAlbum.artistId))
      .innerJoin(library, eq(library.id, musicAlbum.libraryId))
      .where(
        and(
          condition,
          librariesVisibleToViewer(db, viewer),
          eq(library.kind, 'music'),
          albumHasVisibleTrack(viewer),
        ),
      )
      .orderBy(...order)
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      libraryId: row.libraryId,
      title: row.title,
      artist: { id: row.artistId, name: row.artistName },
      year: row.year,
      genres: NamesSchema.parse(row.genres),
      hasArtwork: row.hasArtwork,
      isCompilation: row.isCompilation,
      trackCount: row.trackCount,
      durationSeconds: row.durationSeconds,
      addedAt: row.addedAt.toISOString(),
    }));
  };

  const artistsWhere = async (
    viewer: Viewer,
    condition: SQL | undefined,
    order: SQL[],
    limit: number,
  ): Promise<MusicArtist[]> => {
    const profileId = profileOf(viewer);

    const rows = await db
      .select({
        id: musicArtist.id,
        libraryId: musicArtist.libraryId,
        name: musicArtist.name,
        hasImage: sql<boolean>`${musicArtist.imagePath} is not null`,
        albumCount: sql<number>`(select count(*)::int from ${musicAlbum} where ${musicAlbum.artistId} = ${musicArtist.id})`,
        trackCount: sql<number>`(select count(*)::int from ${musicTrackArtist} where ${musicTrackArtist.artistId} = ${musicArtist.id})`,
        imageAlbumId: sql<
          string | null
        >`(select a.id from ${musicAlbum} a where a."artistId" = ${musicArtist.id} and a."artworkPath" is not null order by a.year desc nulls last limit 1)`,
        isFavourite:
          profileId === null
            ? sql<boolean>`false`
            : sql<boolean>`exists (select 1 from ${favouriteArtist} f where f."artistId" = ${musicArtist.id} and f."profileId" = ${profileId})`,
      })
      .from(musicArtist)
      .innerJoin(library, eq(library.id, musicArtist.libraryId))
      .where(and(condition, librariesVisibleToViewer(db, viewer), eq(library.kind, 'music')))
      .orderBy(...order)
      .limit(limit);

    return rows;
  };

  const visibleTrackFile = async (viewer: Viewer, trackId: string) => {
    const [row] = await db
      .select({
        path: mediaItem.path,
        container: mediaItem.container,
        bitrateKbps: mediaItem.bitrateKbps,
        codec: musicTrack.codec,
        isLossless: musicTrack.isLossless,
        lyrics: musicTrack.lyrics,
      })
      .from(musicTrack)
      .innerJoin(mediaItem, eq(mediaItem.id, musicTrack.mediaItemId))
      .innerJoin(library, eq(library.id, mediaItem.libraryId))
      .where(and(eq(musicTrack.mediaItemId, trackId), trackVisible(viewer)))
      .limit(1);

    return row ?? null;
  };

  return {
    listAlbums: (viewer, options = {}) =>
      albumsWhere(
        viewer,
        undefined,
        options.order === 'title'
          ? [asc(musicAlbum.titleKey)]
          : options.order === 'year'
            ? [desc(sql`coalesce(${musicAlbum.year}, 0)`), asc(musicAlbum.titleKey)]
            : [desc(musicAlbum.addedAt), asc(musicAlbum.titleKey)],
        options.limit ?? 200,
      ),

    listArtists: (viewer, options = {}) => {
      const profileId = profileOf(viewer);

      return artistsWhere(
        viewer,
        options.onlyFavourites === true
          ? profileId === null
            ? sql`false`
            : exists(
                db
                  .select({ one: sql`1` })
                  .from(favouriteArtist)
                  .where(
                    and(
                      eq(favouriteArtist.artistId, musicArtist.id),
                      eq(favouriteArtist.profileId, profileId),
                    ),
                  ),
              )
          : exists(
              db
                .select({ one: sql`1` })
                .from(musicAlbum)
                .where(eq(musicAlbum.artistId, musicArtist.id)),
            ),
        [asc(musicArtist.sortName)],
        options.limit ?? 500,
      );
    },

    readAlbum: async (viewer, albumId) => {
      const [album] = await albumsWhere(viewer, eq(musicAlbum.id, albumId), [], 1);

      if (album === undefined) {
        return null;
      }

      return {
        album,
        tracks: await tracksWhere(viewer, eq(musicTrack.albumId, albumId), inAlbumOrder, 500),
      };
    },

    readArtist: async (viewer, artistId) => {
      const [artist] = await artistsWhere(viewer, eq(musicArtist.id, artistId), [], 1);

      if (artist === undefined) {
        return null;
      }

      const credited = exists(
        db
          .select({ one: sql`1` })
          .from(musicTrackArtist)
          .where(
            and(
              eq(musicTrackArtist.mediaItemId, musicTrack.mediaItemId),
              eq(musicTrackArtist.artistId, artistId),
            ),
          ),
      );

      const albums = await albumsWhere(
        viewer,
        eq(musicAlbum.artistId, artistId),
        [desc(sql`coalesce(${musicAlbum.year}, 0)`), asc(musicAlbum.titleKey)],
        200,
      );

      const appearsOn = await albumsWhere(
        viewer,
        and(
          ne(musicAlbum.artistId, artistId),
          exists(
            db
              .select({ one: sql`1` })
              .from(musicTrack)
              .innerJoin(musicTrackArtist, eq(musicTrackArtist.mediaItemId, musicTrack.mediaItemId))
              .where(
                and(eq(musicTrack.albumId, musicAlbum.id), eq(musicTrackArtist.artistId, artistId)),
              ),
          ),
        ),
        [desc(sql`coalesce(${musicAlbum.year}, 0)`)],
        200,
      );

      const popular = await tracksWhere(
        viewer,
        credited,
        [
          desc(sql`(select count(*) from ${favourite} f where f."mediaItemId" = ${mediaItem.id})`),
          desc(sql`coalesce(${musicAlbum.year}, 0)`),
          ...inAlbumOrder,
        ],
        POPULAR_LIMIT,
      );

      return { artist, albums, appearsOn, popular };
    },

    listTracks: async (viewer, ids) => {
      if (ids.length === 0) {
        return [];
      }

      const found = await tracksWhere(viewer, inArray(mediaItem.id, [...ids]), [], ids.length);
      const byId = new Map(found.map((track) => [track.id, track]));

      return ids.flatMap((id) => {
        const track = byId.get(id);

        return track === undefined ? [] : [track];
      });
    },

    listLiked: async (viewer) => {
      const profileId = profileOf(viewer);

      if (profileId === null) {
        return [];
      }

      return tracksWhere(
        viewer,
        exists(
          db
            .select({ one: sql`1` })
            .from(favourite)
            .where(
              and(eq(favourite.mediaItemId, mediaItem.id), eq(favourite.profileId, profileId)),
            ),
        ),
        [
          desc(
            sql`(select f."keptAt" from ${favourite} f where f."mediaItemId" = ${mediaItem.id} and f."profileId" = ${profileId})`,
          ),
        ],
        LIKED_LIMIT,
      );
    },

    search: async (viewer, query) => {
      const typed = query.trim();

      if (typed === '') {
        return { tracks: [], albums: [], artists: [] };
      }

      const like = `%${typed.replace(/[%_\\]/g, (found) => `\\${found}`)}%`;

      const [tracks, albums, artists] = await Promise.all([
        tracksWhere(
          viewer,
          ilike(mediaItem.title, like),
          [asc(sql`length(${mediaItem.title})`), asc(mediaItem.title)],
          SEARCH_LIMIT,
        ),
        albumsWhere(
          viewer,
          ilike(musicAlbum.title, like),
          [asc(sql`length(${musicAlbum.title})`)],
          SEARCH_LIMIT,
        ),
        artistsWhere(
          viewer,
          ilike(musicArtist.name, like),
          [asc(sql`length(${musicArtist.name})`)],
          SEARCH_LIMIT,
        ),
      ]);

      return { tracks, albums, artists };
    },

    readLyrics: async (viewer, trackId) => {
      const found = await visibleTrackFile(viewer, trackId);

      return found?.lyrics === null || found === null ? null : parseLyrics(found.lyrics);
    },

    readTrackFile: async (viewer, trackId) => {
      const found = await visibleTrackFile(viewer, trackId);

      return found === null
        ? null
        : {
            path: found.path,
            codec: found.codec,
            container: found.container,
            isLossless: found.isLossless,
            bitrateKbps: found.bitrateKbps,
          };
    },

    readAlbumArtwork: async (viewer, albumId) => {
      const [row] = await db
        .select({ path: musicAlbum.artworkPath })
        .from(musicAlbum)
        .innerJoin(library, eq(library.id, musicAlbum.libraryId))
        .where(
          and(
            eq(musicAlbum.id, albumId),
            isNotNull(musicAlbum.artworkPath),
            librariesVisibleToViewer(db, viewer),
          ),
        )
        .limit(1);

      return row?.path ?? null;
    },

    readArtistImage: async (viewer, artistId) => {
      const [row] = await db
        .select({ path: musicArtist.imagePath })
        .from(musicArtist)
        .innerJoin(library, eq(library.id, musicArtist.libraryId))
        .where(
          and(
            eq(musicArtist.id, artistId),
            isNotNull(musicArtist.imagePath),
            librariesVisibleToViewer(db, viewer),
          ),
        )
        .limit(1);

      return row?.path ?? null;
    },

    keepArtist: async (profileId, artistId) => {
      const [known] = await db
        .select({ id: musicArtist.id })
        .from(musicArtist)
        .where(eq(musicArtist.id, artistId))
        .limit(1);

      if (known === undefined) {
        return false;
      }

      await db.insert(favouriteArtist).values({ profileId, artistId }).onConflictDoNothing();

      return true;
    },

    dropArtist: async (profileId, artistId) => {
      const dropped = await db
        .delete(favouriteArtist)
        .where(
          and(eq(favouriteArtist.profileId, profileId), eq(favouriteArtist.artistId, artistId)),
        )
        .returning({ artistId: favouriteArtist.artistId });

      return dropped.length > 0;
    },
  };
};

export { createDatabaseMusicService };
