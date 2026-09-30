import { and, asc, eq, ilike, inArray, isNull, or } from 'drizzle-orm';
import {
  library,
  mediaItem,
  musicAlbum,
  musicArtist,
  musicTrack,
  musicTrackArtist,
  series,
} from '#dialect/Schema';
import { likeLiterally } from '@ValenceDatabase/likeLiterally';
import type { MediaRef } from '@ValenceSDK/host/ValenceHost';
import type { ValenceDatabase } from '#dialect/ValenceDatabase';
import type { PluginHost } from '@ValenceServer/plugins/broker/PluginHost';

const MOST_FOUND = 25;

const ITEM_KINDS: readonly MediaRef['kind'][] = ['film', 'episode', 'track', 'book'];

/**
 * What the library holds, in the one plain shape a plugin is shown: films, series, episodes,
 * albums, tracks and books, each with the outside ids Valence knows it by. Extras and alternative
 * versions are never among them, because a plugin syncing what somebody watched means the film.
 *
 * @param db - The database.
 * @returns How a plugin searches the library and finds things in it.
 */
const createDatabaseMediaRefs = (
  db: ValenceDatabase,
): PluginHost['library'] & { findTrack: PluginHost['music']['findTrack'] } => {
  const itemColumns = {
    id: mediaItem.id,
    title: mediaItem.title,
    year: mediaItem.year,
    seriesId: mediaItem.seriesId,
    seasonNumber: mediaItem.seasonNumber,
    episodeNumber: mediaItem.episodeNumber,
    externalId: mediaItem.externalId,
    imdbId: mediaItem.imdbId,
    libraryKind: library.kind,
  };

  type ItemRow = {
    id: string;
    title: string;
    year: number | null;
    seriesId: string | null;
    seasonNumber: number | null;
    episodeNumber: number | null;
    externalId: string | null;
    imdbId: string | null;
    libraryKind: string;
  };

  const kindOfItem = (row: ItemRow): MediaRef['kind'] | null => {
    switch (row.libraryKind) {
      case 'movies':
        return 'film';
      case 'shows':
        return 'episode';
      case 'music':
        return 'track';
      case 'books':
        return 'book';
      default:
        return null;
    }
  };

  const asItemRef = (row: ItemRow): MediaRef | null => {
    const kind = kindOfItem(row);

    if (kind === null) {
      return null;
    }

    return {
      id: row.id,
      kind,
      title: row.title,
      year: row.year,
      seriesId: row.seriesId,
      seasonNumber: row.seasonNumber,
      episodeNumber: row.episodeNumber,
      externalIds: {
        ...(kind === 'film' && row.externalId !== null ? { tmdb: row.externalId } : {}),
        ...(row.imdbId === null ? {} : { imdb: row.imdbId }),
      },
    };
  };

  const items = async (where: ReturnType<typeof and>): Promise<MediaRef[]> => {
    const rows = await db
      .select(itemColumns)
      .from(mediaItem)
      .innerJoin(library, eq(library.id, mediaItem.libraryId))
      .where(and(isNull(mediaItem.parentId), isNull(mediaItem.extraKind), where))
      .orderBy(asc(mediaItem.title))
      .limit(MOST_FOUND);

    return rows.flatMap((row) => asItemRef(row) ?? []);
  };

  const seriesRefs = async (where: ReturnType<typeof and>): Promise<MediaRef[]> => {
    const rows = await db
      .select({ id: series.id, title: series.title, externalId: series.externalId })
      .from(series)
      .where(where)
      .orderBy(asc(series.title))
      .limit(MOST_FOUND);

    return rows.map((row) => ({
      id: row.id,
      kind: 'series',
      title: row.title,
      year: null,
      seriesId: null,
      seasonNumber: null,
      episodeNumber: null,
      externalIds: row.externalId === null ? {} : { tmdb: row.externalId },
    }));
  };

  const albumRefs = async (where: ReturnType<typeof and>): Promise<MediaRef[]> => {
    const rows = await db
      .select({
        id: musicAlbum.id,
        title: musicAlbum.title,
        year: musicAlbum.year,
        musicbrainzId: musicAlbum.musicbrainzId,
      })
      .from(musicAlbum)
      .where(where)
      .orderBy(asc(musicAlbum.title))
      .limit(MOST_FOUND);

    return rows.map((row) => ({
      id: row.id,
      kind: 'album',
      title: row.title,
      year: row.year,
      seriesId: null,
      seasonNumber: null,
      episodeNumber: null,
      externalIds: row.musicbrainzId === null ? {} : { musicbrainz: row.musicbrainzId },
    }));
  };

  const libraryKindsFor = (kinds: readonly MediaRef['kind'][]): string[] =>
    kinds.flatMap((kind) => {
      switch (kind) {
        case 'film':
          return ['movies'];
        case 'episode':
          return ['shows'];
        case 'track':
          return ['music'];
        case 'book':
          return ['books'];
        case 'series':
        case 'album':
          return [];
      }
    });

  return {
    search: async (query, kinds) => {
      const wanted: readonly MediaRef['kind'][] =
        kinds.length === 0 ? [...ITEM_KINDS, 'series', 'album'] : kinds;
      const pattern = `%${likeLiterally(query)}%`;
      const itemKinds = libraryKindsFor(wanted);
      const found = await Promise.all([
        itemKinds.length === 0
          ? Promise.resolve([])
          : items(and(inArray(library.kind, itemKinds), ilike(mediaItem.title, pattern))),
        wanted.includes('series') ? seriesRefs(ilike(series.title, pattern)) : Promise.resolve([]),
        wanted.includes('album')
          ? albumRefs(ilike(musicAlbum.title, pattern))
          : Promise.resolve([]),
      ]);

      return found.flat().slice(0, MOST_FOUND);
    },
    findByExternalId: async (source, id) => {
      switch (source) {
        case 'tmdb': {
          const found = await Promise.all([
            items(and(eq(library.kind, 'movies'), eq(mediaItem.externalId, id))),
            seriesRefs(eq(series.externalId, id)),
          ]);

          return found.flat();
        }
        case 'imdb':
          return items(eq(mediaItem.imdbId, id));
        case 'musicbrainz':
          return albumRefs(
            or(eq(musicAlbum.musicbrainzId, id), eq(musicAlbum.releaseGroupMusicbrainzId, id)),
          );
        case 'isrc':
        case 'tvdb':
        case 'anilist':
        case 'mal':
          return [];
      }
    },
    episodes: async (seriesId) => {
      const rows = await db
        .select(itemColumns)
        .from(mediaItem)
        .innerJoin(library, eq(library.id, mediaItem.libraryId))
        .where(
          and(
            eq(mediaItem.seriesId, seriesId),
            isNull(mediaItem.parentId),
            isNull(mediaItem.extraKind),
          ),
        )
        .orderBy(asc(mediaItem.seasonNumber), asc(mediaItem.episodeNumber));

      return rows.flatMap((row) => asItemRef(row) ?? []);
    },
    findTrack: async (track) => {
      const rows = await db
        .select({ ...itemColumns, album: musicAlbum.title })
        .from(mediaItem)
        .innerJoin(library, eq(library.id, mediaItem.libraryId))
        .innerJoin(musicTrack, eq(musicTrack.mediaItemId, mediaItem.id))
        .innerJoin(musicAlbum, eq(musicAlbum.id, musicTrack.albumId))
        .innerJoin(musicTrackArtist, eq(musicTrackArtist.mediaItemId, mediaItem.id))
        .innerJoin(musicArtist, eq(musicArtist.id, musicTrackArtist.artistId))
        .where(
          and(
            ilike(mediaItem.title, likeLiterally(track.title)),
            ilike(musicArtist.name, likeLiterally(track.artist)),
          ),
        )
        .limit(MOST_FOUND);
      const onAlbum =
        track.album === null
          ? undefined
          : rows.find((row) => row.album.toLowerCase() === track.album?.toLowerCase());
      const chosen = onAlbum ?? rows[0];

      return chosen === undefined ? null : asItemRef(chosen);
    },
  };
};

export { createDatabaseMediaRefs };
