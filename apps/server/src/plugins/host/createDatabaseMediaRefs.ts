import { and, asc, eq, inArray, isNull, or } from 'drizzle-orm';
import {
  book,
  bookChapter,
  library,
  mediaItem,
  musicAlbum,
  musicArtist,
  musicTrack,
  musicTrackArtist,
  series,
} from '#dialect/Schema';
import { AUDIOBOOK_FORMATS } from '@ValenceContracts/schemas/Book';
import { containsInsensitively } from '@ValenceDatabase/containsInsensitively';
import { likeLiterally } from '@ValenceDatabase/likeLiterally';
import { isTheTrackNamed } from '@ValenceServer/music/isTheTrackNamed';
import type { MediaRef } from '@ValenceSDK/host/ValenceHost';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { PluginHost } from '@ValenceServer/plugins/broker/PluginHost';

const MOST_FOUND = 25;

const EVERY_KIND: readonly MediaRef['kind'][] = [
  'film',
  'episode',
  'track',
  'series',
  'album',
  'book',
];

/**
 * What the library holds, in the one plain shape a plugin is shown: films, series, episodes,
 * albums, tracks and books, each with the outside ids Valence knows it by. Extras and alternative
 * versions are never among them, because a plugin syncing what somebody watched means the film.
 *
 * @param db - The database.
 * @returns How a plugin searches the library and finds things in it.
 */
const createDatabaseMediaRefs = (
  db: AnyValenceDatabase,
): PluginHost['library'] & { findTrack: PluginHost['music']['findTrack'] } => {
  const itemColumns = {
    id: mediaItem.id,
    title: mediaItem.title,
    year: mediaItem.year,
    seriesId: mediaItem.seriesId,
    seasonNumber: mediaItem.seasonNumber,
    episodeNumber: mediaItem.episodeNumber,
    durationSeconds: mediaItem.durationSeconds,
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
    durationSeconds: number;
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
      durationSeconds: row.durationSeconds > 0 ? row.durationSeconds : null,
      artist: null,
      album: null,
      externalIds: {
        ...(kind === 'film' && row.externalId !== null ? { tmdb: row.externalId } : {}),
        ...(row.imdbId === null ? {} : { imdb: row.imdbId }),
      },
    };
  };

  const withCredits = async (refs: MediaRef[]): Promise<MediaRef[]> => {
    const trackIds = refs.flatMap((ref) => (ref.kind === 'track' ? [ref.id] : []));

    if (trackIds.length === 0) {
      return refs;
    }

    const [albums, artists] = await Promise.all([
      db
        .select({
          mediaItemId: musicTrack.mediaItemId,
          album: musicAlbum.title,
          albumArtist: musicArtist.name,
        })
        .from(musicTrack)
        .innerJoin(musicAlbum, eq(musicAlbum.id, musicTrack.albumId))
        .innerJoin(musicArtist, eq(musicArtist.id, musicAlbum.artistId))
        .where(inArray(musicTrack.mediaItemId, trackIds)),
      db
        .select({ mediaItemId: musicTrackArtist.mediaItemId, name: musicArtist.name })
        .from(musicTrackArtist)
        .innerJoin(musicArtist, eq(musicArtist.id, musicTrackArtist.artistId))
        .where(inArray(musicTrackArtist.mediaItemId, trackIds))
        .orderBy(asc(musicTrackArtist.position)),
    ]);

    return refs.map((ref) => {
      const onAlbum = albums.find((row) => row.mediaItemId === ref.id);
      const firstCredited = artists.find((row) => row.mediaItemId === ref.id);

      return {
        ...ref,
        artist: firstCredited?.name ?? onAlbum?.albumArtist ?? null,
        album: onAlbum?.album ?? null,
      };
    });
  };

  const items = async (where: ReturnType<typeof and>): Promise<MediaRef[]> => {
    const rows = await db
      .select(itemColumns)
      .from(mediaItem)
      .innerJoin(library, eq(library.id, mediaItem.libraryId))
      .where(and(isNull(mediaItem.parentId), isNull(mediaItem.extraKind), where))
      .orderBy(asc(mediaItem.title))
      .limit(MOST_FOUND);

    return withCredits(rows.flatMap((row) => asItemRef(row) ?? []));
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
      durationSeconds: null,
      artist: null,
      album: null,
      externalIds: row.externalId === null ? {} : { tmdb: row.externalId },
    }));
  };

  const albumRefs = async (where: ReturnType<typeof and>): Promise<MediaRef[]> => {
    const rows = await db
      .select({
        id: musicAlbum.id,
        title: musicAlbum.title,
        year: musicAlbum.year,
        artist: musicArtist.name,
        musicbrainzId: musicAlbum.musicbrainzId,
      })
      .from(musicAlbum)
      .innerJoin(musicArtist, eq(musicArtist.id, musicAlbum.artistId))
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
      durationSeconds: null,
      artist: row.artist,
      album: null,
      externalIds: row.musicbrainzId === null ? {} : { musicbrainz: row.musicbrainzId },
    }));
  };

  const bookRefs = async (where: ReturnType<typeof and>): Promise<MediaRef[]> => {
    const rows = await db
      .select({ id: book.id, title: book.title, year: book.year })
      .from(book)
      .where(where)
      .orderBy(asc(book.title))
      .limit(MOST_FOUND);

    if (rows.length === 0) {
      return [];
    }

    const heard = await db
      .select({ bookId: bookChapter.bookId, durationSeconds: bookChapter.durationSeconds })
      .from(bookChapter)
      .where(
        and(
          inArray(
            bookChapter.bookId,
            rows.map((row) => row.id),
          ),
          inArray(bookChapter.format, [...AUDIOBOOK_FORMATS]),
        ),
      );

    return rows.map((row) => {
      const runningSeconds = heard
        .filter((track) => track.bookId === row.id)
        .reduce((all, track) => all + (track.durationSeconds ?? 0), 0);

      return {
        id: row.id,
        kind: 'book',
        title: row.title,
        year: row.year,
        seriesId: null,
        seasonNumber: null,
        episodeNumber: null,
        durationSeconds: runningSeconds > 0 ? runningSeconds : null,
        artist: null,
        album: null,
        externalIds: {},
      };
    });
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
        case 'series':
        case 'album':
        case 'book':
          return [];
      }
    });

  return {
    get: async (mediaId) => {
      const [item] = await db
        .select({ parentId: mediaItem.parentId, extraKind: mediaItem.extraKind })
        .from(mediaItem)
        .where(eq(mediaItem.id, mediaId))
        .limit(1);

      if (item !== undefined) {
        if (item.extraKind !== null) {
          return null;
        }

        const [found] = await items(eq(mediaItem.id, item.parentId ?? mediaId));

        return found ?? null;
      }

      const [found] = (
        await Promise.all([
          seriesRefs(eq(series.id, mediaId)),
          albumRefs(eq(musicAlbum.id, mediaId)),
          bookRefs(eq(book.id, mediaId)),
        ])
      ).flat();

      return found ?? null;
    },
    search: async (query, kinds) => {
      const wanted: readonly MediaRef['kind'][] = kinds.length === 0 ? EVERY_KIND : kinds;
      const pattern = `%${likeLiterally(query)}%`;
      const itemKinds = libraryKindsFor(wanted);
      const found = await Promise.all([
        itemKinds.length === 0
          ? Promise.resolve([])
          : items(
              and(
                inArray(library.kind, itemKinds),
                containsInsensitively(mediaItem.title, pattern),
              ),
            ),
        wanted.includes('series')
          ? seriesRefs(containsInsensitively(series.title, pattern))
          : Promise.resolve([]),
        wanted.includes('album')
          ? albumRefs(containsInsensitively(musicAlbum.title, pattern))
          : Promise.resolve([]),
        wanted.includes('book')
          ? bookRefs(containsInsensitively(book.title, pattern))
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
        .where(isTheTrackNamed(track.title, track.artist))
        .limit(MOST_FOUND);
      const onAlbum =
        track.album === null
          ? undefined
          : rows.find((row) => row.album.toLowerCase() === track.album?.toLowerCase());
      const chosen = onAlbum ?? rows[0];
      const ref = chosen === undefined ? null : asItemRef(chosen);

      if (ref === null) {
        return null;
      }

      const [credited] = await withCredits([ref]);

      return credited ?? null;
    },
  };
};

export { createDatabaseMediaRefs };
