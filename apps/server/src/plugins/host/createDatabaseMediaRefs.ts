import { bookHasSomethingStillThere } from '@ValenceServer/visibility/bookHasSomethingStillThere';
import { albumHasSomethingStillThere } from '@ValenceServer/visibility/albumHasSomethingStillThere';
import { isStillThere } from '@ValenceServer/visibility/isStillThere';
import { hasSomethingStillThere } from '@ValenceServer/visibility/hasSomethingStillThere';
import { and, asc, eq, exists, inArray, isNull, or, sql } from 'drizzle-orm';
import { visibleToViewer } from '@ValenceServer/visibility/visibleToViewer';
import { booksVisibleToViewer } from '@ValenceServer/visibility/booksVisibleToViewer';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
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
 * Every read is made for a viewer, and shows only what the app would show them: what their account
 * and profile may reach, less what they hid and libraries still locked to them. A page or panel
 * drawn for somebody reads as them, and only background work reads as the server, seeing
 * everything.
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
      case 'anime':
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

  const reachedBy = (viewer: Viewer, where: ReturnType<typeof and>) =>
    exists(
      db
        .select({ one: sql`1` })
        .from(mediaItem)
        .where(and(where, isStillThere(), visibleToViewer(db, viewer))),
    );

  const items = async (
    where: ReturnType<typeof and>,
    viewer: Viewer,
    includesStreamed = false,
  ): Promise<MediaRef[]> => {
    const rows = await db
      .select(itemColumns)
      .from(mediaItem)
      .innerJoin(library, eq(library.id, mediaItem.libraryId))
      .where(
        and(
          isNull(mediaItem.parentId),
          isNull(mediaItem.extraKind),
          isStillThere(),
          visibleToViewer(db, viewer, { includesStreamed }),
          where,
        ),
      )
      .orderBy(asc(mediaItem.title))
      .limit(MOST_FOUND);

    return withCredits(rows.flatMap((row) => asItemRef(row) ?? []));
  };

  const seriesRefs = async (where: ReturnType<typeof and>, viewer: Viewer): Promise<MediaRef[]> => {
    const rows = await db
      .select({
        id: series.id,
        title: series.title,
        externalId: series.externalId,
        anilistId: series.anilistId,
        malId: series.malId,
      })
      .from(series)
      .where(
        and(
          where,
          viewer.kind === 'server'
            ? hasSomethingStillThere(db)
            : reachedBy(viewer, eq(mediaItem.seriesId, series.id)),
        ),
      )
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
      externalIds: {
        ...(row.externalId === null ? {} : { tmdb: row.externalId }),
        ...(row.anilistId === null ? {} : { anilist: row.anilistId.toString() }),
        ...(row.malId === null ? {} : { mal: row.malId.toString() }),
      },
    }));
  };

  const albumRefs = async (where: ReturnType<typeof and>, viewer: Viewer): Promise<MediaRef[]> => {
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
      .where(
        and(
          where,
          viewer.kind === 'server'
            ? albumHasSomethingStillThere(db)
            : reachedBy(
                viewer,
                inArray(
                  mediaItem.id,
                  db
                    .select({ id: musicTrack.mediaItemId })
                    .from(musicTrack)
                    .where(eq(musicTrack.albumId, musicAlbum.id)),
                ),
              ),
        ),
      )
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

  const bookRefs = async (where: ReturnType<typeof and>, viewer: Viewer): Promise<MediaRef[]> => {
    const rows = await db
      .select({ id: book.id, title: book.title, year: book.year })
      .from(book)
      .where(
        and(
          where,
          viewer.kind === 'server'
            ? bookHasSomethingStillThere(db)
            : booksVisibleToViewer(db, viewer),
        ),
      )
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
          isNull(bookChapter.missingSince),
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
          return ['shows', 'anime'];
        case 'track':
          return ['music'];
        case 'series':
        case 'album':
        case 'book':
          return [];
      }
    });

  return {
    get: async (mediaId, viewer) => {
      const [item] = await db
        .select({ parentId: mediaItem.parentId, extraKind: mediaItem.extraKind })
        .from(mediaItem)
        .where(eq(mediaItem.id, mediaId))
        .limit(1);

      if (item !== undefined) {
        if (item.extraKind !== null) {
          return null;
        }

        const [found] = await items(eq(mediaItem.id, item.parentId ?? mediaId), viewer, true);

        return found ?? null;
      }

      const [found] = (
        await Promise.all([
          seriesRefs(eq(series.id, mediaId), viewer),
          albumRefs(eq(musicAlbum.id, mediaId), viewer),
          bookRefs(eq(book.id, mediaId), viewer),
        ])
      ).flat();

      return found ?? null;
    },
    search: async (query, kinds, viewer) => {
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
              viewer,
            ),
        wanted.includes('series')
          ? seriesRefs(containsInsensitively(series.title, pattern), viewer)
          : Promise.resolve([]),
        wanted.includes('album')
          ? albumRefs(containsInsensitively(musicAlbum.title, pattern), viewer)
          : Promise.resolve([]),
        wanted.includes('book')
          ? bookRefs(containsInsensitively(book.title, pattern), viewer)
          : Promise.resolve([]),
      ]);

      return found.flat().slice(0, MOST_FOUND);
    },
    findByExternalId: async (source, id, viewer) => {
      switch (source) {
        case 'tmdb': {
          const found = await Promise.all([
            items(and(eq(library.kind, 'movies'), eq(mediaItem.externalId, id)), viewer),
            seriesRefs(eq(series.externalId, id), viewer),
          ]);

          return found.flat();
        }
        case 'imdb':
          return items(eq(mediaItem.imdbId, id), viewer);
        case 'musicbrainz':
          return albumRefs(
            or(eq(musicAlbum.musicbrainzId, id), eq(musicAlbum.releaseGroupMusicbrainzId, id)),
            viewer,
          );
        case 'anilist':
          return /^\d+$/.test(id) ? seriesRefs(eq(series.anilistId, Number(id)), viewer) : [];
        case 'mal':
          return /^\d+$/.test(id) ? seriesRefs(eq(series.malId, Number(id)), viewer) : [];
        case 'isrc':
        case 'tvdb':
          return [];
      }
    },
    episodes: async (seriesId, viewer) => {
      const rows = await db
        .select(itemColumns)
        .from(mediaItem)
        .innerJoin(library, eq(library.id, mediaItem.libraryId))
        .where(
          and(
            eq(mediaItem.seriesId, seriesId),
            isNull(mediaItem.parentId),
            isNull(mediaItem.extraKind),
            isStillThere(),
            visibleToViewer(db, viewer),
          ),
        )
        .orderBy(asc(mediaItem.seasonNumber), asc(mediaItem.episodeNumber));

      return rows.flatMap((row) => asItemRef(row) ?? []);
    },
    sees: async (subject, viewer) => {
      if (subject.kind === 'artist') {
        const [found] = await db
          .select({ one: sql`1` })
          .from(musicArtist)
          .where(
            and(
              eq(musicArtist.id, subject.id),
              reachedBy(
                viewer,
                inArray(
                  mediaItem.id,
                  db
                    .select({ id: musicTrackArtist.mediaItemId })
                    .from(musicTrackArtist)
                    .where(eq(musicTrackArtist.artistId, musicArtist.id)),
                ),
              ),
            ),
          )
          .limit(1);

        return found !== undefined;
      }

      const found = await (subject.kind === 'series'
        ? seriesRefs(eq(series.id, subject.id), viewer)
        : subject.kind === 'album'
          ? albumRefs(eq(musicAlbum.id, subject.id), viewer)
          : items(eq(mediaItem.id, subject.id), viewer, true));

      return found.length > 0;
    },
    findTrack: async (track, viewer) => {
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
            isTheTrackNamed(track.title, track.artist),
            isStillThere(),
            visibleToViewer(db, viewer),
          ),
        )
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
