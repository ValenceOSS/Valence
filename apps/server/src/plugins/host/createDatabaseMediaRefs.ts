import { bookHasSomethingStillThere } from '@ValenceServer/visibility/bookHasSomethingStillThere';
import { PluginRefusalError } from '@ValenceServer/plugins/broker/PluginRefusalError';
import { albumHasSomethingStillThere } from '@ValenceServer/visibility/albumHasSomethingStillThere';
import { artistHasSomethingStillThere } from '@ValenceServer/visibility/artistHasSomethingStillThere';
import { isStillThere } from '@ValenceServer/visibility/isStillThere';
import { hasSomethingStillThere } from '@ValenceServer/visibility/hasSomethingStillThere';
import { and, asc, eq, exists, gt, inArray, isNull, or, sql } from 'drizzle-orm';
import type { AnyColumn, SQL } from 'drizzle-orm';
import { z } from 'zod';
import { NamesSchema } from '@ValenceServer/music/NamesSchema';
import { IN_ALBUM_ORDER } from '@ValenceServer/music/IN_ALBUM_ORDER';
import { nullsLast } from '@ValenceDatabase/nullsLast';
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
import type { MediaDetails, MediaRef } from '@ValenceSDK/host/ValenceHost';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { PluginHost } from '@ValenceServer/plugins/broker/PluginHost';

const MOST_FOUND = 25;

const MOST_CHILDREN = 2000;

const EVERY_KIND: readonly MediaRef['kind'][] = [
  'film',
  'episode',
  'track',
  'series',
  'artist',
  'album',
  'book',
];

const PageMarkSchema = z.tuple([z.string(), z.string(), z.string()]);

type Page = { limit: number; after: { title: string; id: string } | null };

const FIRST_FEW: Page = { limit: MOST_FOUND, after: null };

/**
 * Where a page of a list starts: after the title and id the last page ended on.
 *
 * @param title - The column the list is ordered by.
 * @param id - The column that breaks a tie between equal titles.
 * @param after - Where the last page ended, or nothing for the first.
 * @returns The condition, or nothing for the first page.
 */
const pastMark = (title: AnyColumn, id: AnyColumn, after: Page['after']): SQL | undefined =>
  after === null
    ? undefined
    : or(gt(title, after.title), and(eq(title, after.title), gt(id, after.id)));

/**
 * Writes where a page ended as the plain mark a plugin hands back for the next one.
 *
 * @param kind - What the list is of.
 * @param last - The last thing on the page.
 * @returns The mark.
 */
const markAfter = (kind: MediaRef['kind'], last: { title: string; id: string }): string =>
  Buffer.from(JSON.stringify([kind, last.title, last.id])).toString('base64url');

/**
 * Reads a mark a plugin handed back, refusing one Valence did not give for this list.
 *
 * @param kind - What the list is of.
 * @param mark - The mark.
 * @returns Where the page ended.
 */
const readMark = (kind: MediaRef['kind'], mark: string): { title: string; id: string } => {
  const read = (() => {
    try {
      return PageMarkSchema.safeParse(JSON.parse(Buffer.from(mark, 'base64url').toString('utf8')));
    } catch {
      return null;
    }
  })();

  if (read === null || !read.success || read.data[0] !== kind) {
    throw new PluginRefusalError('That page mark is not one Valence gave for this list.');
  }

  return { title: read.data[1], id: read.data[2] };
};

/**
 * What the library holds, in the one plain shape a plugin is shown: films, series, episodes,
 * artists, albums, tracks and books, each with the outside ids Valence knows it by. Extras and
 * alternative versions are never among them, because a plugin syncing what somebody watched means
 * the film.
 *
 * Every read is made for a viewer, and shows only what their account and profile may reach, less
 * libraries still locked to them. What they hid from their own lists is still found, since a plugin
 * syncing what they watched means everything they watched. Only a plugin allowed to read every
 * library reads as the server, seeing everything.
 *
 * @param db - The database.
 * @returns How a plugin searches the library, lists it and finds things in it.
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

  const inReach = (viewer: Viewer, includesStreamed = false) =>
    visibleToViewer(db, viewer, { includesStreamed, includesHidden: true });

  const reachedBy = (viewer: Viewer, where: ReturnType<typeof and>) =>
    exists(
      db
        .select({ one: sql`1` })
        .from(mediaItem)
        .where(and(where, isStillThere(), inReach(viewer))),
    );

  const itemInSight = (viewer: Viewer, includesStreamed = false) =>
    and(
      isNull(mediaItem.parentId),
      isNull(mediaItem.extraKind),
      isStillThere(),
      inReach(viewer, includesStreamed),
    );

  const seriesInSight = (viewer: Viewer) =>
    viewer.kind === 'server'
      ? hasSomethingStillThere(db)
      : reachedBy(viewer, eq(mediaItem.seriesId, series.id));

  const albumInSight = (viewer: Viewer) =>
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
        );

  const artistInSight = (viewer: Viewer) =>
    viewer.kind === 'server'
      ? artistHasSomethingStillThere(db)
      : reachedBy(
          viewer,
          or(
            inArray(
              mediaItem.id,
              db
                .select({ id: musicTrackArtist.mediaItemId })
                .from(musicTrackArtist)
                .where(eq(musicTrackArtist.artistId, musicArtist.id)),
            ),
            inArray(
              mediaItem.id,
              db
                .select({ id: musicTrack.mediaItemId })
                .from(musicTrack)
                .innerJoin(musicAlbum, eq(musicAlbum.id, musicTrack.albumId))
                .where(eq(musicAlbum.artistId, musicArtist.id)),
            ),
          ),
        );

  const bookInSight = (viewer: Viewer) =>
    viewer.kind === 'server' ? bookHasSomethingStillThere(db) : booksVisibleToViewer(db, viewer);

  const items = async (
    where: ReturnType<typeof and>,
    viewer: Viewer,
    includesStreamed = false,
    page: Page = FIRST_FEW,
  ): Promise<MediaRef[]> => {
    const rows = await db
      .select(itemColumns)
      .from(mediaItem)
      .innerJoin(library, eq(library.id, mediaItem.libraryId))
      .where(
        and(
          itemInSight(viewer, includesStreamed),
          where,
          pastMark(mediaItem.title, mediaItem.id, page.after),
        ),
      )
      .orderBy(asc(mediaItem.title), asc(mediaItem.id))
      .limit(page.limit);

    return withCredits(rows.flatMap((row) => asItemRef(row) ?? []));
  };

  const seriesRefs = async (
    where: ReturnType<typeof and>,
    viewer: Viewer,
    page: Page = FIRST_FEW,
  ): Promise<MediaRef[]> => {
    const rows = await db
      .select({
        id: series.id,
        title: series.title,
        externalId: series.externalId,
        anilistId: series.anilistId,
        malId: series.malId,
      })
      .from(series)
      .where(and(where, seriesInSight(viewer), pastMark(series.title, series.id, page.after)))
      .orderBy(asc(series.title), asc(series.id))
      .limit(page.limit);

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

  const artistRefs = async (
    where: ReturnType<typeof and>,
    viewer: Viewer,
    page: Page = FIRST_FEW,
  ): Promise<MediaRef[]> => {
    const rows = await db
      .select({
        id: musicArtist.id,
        title: musicArtist.name,
        musicbrainzId: musicArtist.musicbrainzId,
      })
      .from(musicArtist)
      .where(
        and(where, artistInSight(viewer), pastMark(musicArtist.name, musicArtist.id, page.after)),
      )
      .orderBy(asc(musicArtist.name), asc(musicArtist.id))
      .limit(page.limit);

    return rows.map((row) => ({
      id: row.id,
      kind: 'artist',
      title: row.title,
      year: null,
      seriesId: null,
      seasonNumber: null,
      episodeNumber: null,
      durationSeconds: null,
      artist: null,
      album: null,
      externalIds: row.musicbrainzId === null ? {} : { musicbrainz: row.musicbrainzId },
    }));
  };

  const albumRefs = async (
    where: ReturnType<typeof and>,
    viewer: Viewer,
    page: Page = FIRST_FEW,
  ): Promise<MediaRef[]> => {
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
        and(where, albumInSight(viewer), pastMark(musicAlbum.title, musicAlbum.id, page.after)),
      )
      .orderBy(asc(musicAlbum.title), asc(musicAlbum.id))
      .limit(page.limit);

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

  const bookRefs = async (
    where: ReturnType<typeof and>,
    viewer: Viewer,
    page: Page = FIRST_FEW,
  ): Promise<MediaRef[]> => {
    const rows = await db
      .select({ id: book.id, title: book.title, year: book.year })
      .from(book)
      .where(and(where, bookInSight(viewer), pastMark(book.title, book.id, page.after)))
      .orderBy(asc(book.title), asc(book.id))
      .limit(page.limit);

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
        case 'artist':
        case 'album':
        case 'book':
          return [];
      }
    });

  const episodesOf = async (seriesId: string, viewer: Viewer): Promise<MediaRef[]> => {
    const rows = await db
      .select(itemColumns)
      .from(mediaItem)
      .innerJoin(library, eq(library.id, mediaItem.libraryId))
      .where(and(eq(mediaItem.seriesId, seriesId), itemInSight(viewer)))
      .orderBy(
        nullsLast(mediaItem.seasonNumber, 'asc'),
        nullsLast(mediaItem.episodeNumber, 'asc'),
        asc(mediaItem.id),
      );

    return rows.flatMap((row) => asItemRef(row) ?? []);
  };

  const tracksOf = async (albumId: string, viewer: Viewer): Promise<MediaRef[]> => {
    const rows = await db
      .select(itemColumns)
      .from(mediaItem)
      .innerJoin(library, eq(library.id, mediaItem.libraryId))
      .innerJoin(musicTrack, eq(musicTrack.mediaItemId, mediaItem.id))
      .where(and(eq(musicTrack.albumId, albumId), itemInSight(viewer)))
      .orderBy(...IN_ALBUM_ORDER)
      .limit(MOST_CHILDREN);

    return withCredits(rows.flatMap((row) => asItemRef(row) ?? []));
  };

  const listOf = (kind: MediaRef['kind'], viewer: Viewer, page: Page): Promise<MediaRef[]> => {
    switch (kind) {
      case 'film':
      case 'episode':
      case 'track':
        return items(inArray(library.kind, libraryKindsFor([kind])), viewer, false, page);
      case 'series':
        return seriesRefs(undefined, viewer, page);
      case 'artist':
        return artistRefs(undefined, viewer, page);
      case 'album':
        return albumRefs(undefined, viewer, page);
      case 'book':
        return bookRefs(undefined, viewer, page);
    }
  };

  const itemDetails = async (ids: readonly string[], viewer: Viewer): Promise<MediaDetails[]> => {
    const rows = await db
      .select({
        ...itemColumns,
        overview: mediaItem.overview,
        genres: mediaItem.genres,
        rating: mediaItem.rating,
        certificationAge: mediaItem.certificationAge,
        addedAt: mediaItem.addedAt,
        container: mediaItem.container,
        sizeBytes: mediaItem.sizeBytes,
        bitrateKbps: mediaItem.bitrateKbps,
        albumId: musicTrack.albumId,
        discNumber: musicTrack.discNumber,
        trackNumber: musicTrack.trackNumber,
        albumArtistId: musicAlbum.artistId,
      })
      .from(mediaItem)
      .innerJoin(library, eq(library.id, mediaItem.libraryId))
      .leftJoin(musicTrack, eq(musicTrack.mediaItemId, mediaItem.id))
      .leftJoin(musicAlbum, eq(musicAlbum.id, musicTrack.albumId))
      .where(and(inArray(mediaItem.id, [...ids]), itemInSight(viewer, true)));

    if (rows.length === 0) {
      return [];
    }

    const credited = await db
      .select({ mediaItemId: musicTrackArtist.mediaItemId, artistId: musicTrackArtist.artistId })
      .from(musicTrackArtist)
      .where(
        inArray(
          musicTrackArtist.mediaItemId,
          rows.map((row) => row.id),
        ),
      )
      .orderBy(asc(musicTrackArtist.position));
    const refs = await withCredits(rows.flatMap((row) => asItemRef(row) ?? []));

    return refs.flatMap((ref) => {
      const row = rows.find((each) => each.id === ref.id);

      if (row === undefined) {
        return [];
      }

      return [
        {
          ...ref,
          overview: row.overview,
          genres: NamesSchema.parse(row.genres),
          communityRating: row.rating,
          certificationAge: row.certificationAge,
          addedAt: row.addedAt.toISOString(),
          albumId: row.albumId,
          artistId:
            credited.find((each) => each.mediaItemId === row.id)?.artistId ??
            row.albumArtistId ??
            null,
          discNumber: row.discNumber,
          trackNumber: row.trackNumber,
          file: {
            container: row.container,
            sizeBytes: row.sizeBytes,
            bitrateKbps: row.bitrateKbps,
          },
        },
      ];
    });
  };

  const plainDetails = (
    ref: MediaRef,
    extra: Partial<Omit<MediaDetails, keyof MediaRef>>,
  ): MediaDetails => ({
    ...ref,
    overview: null,
    genres: [],
    communityRating: null,
    certificationAge: null,
    addedAt: null,
    albumId: null,
    artistId: null,
    discNumber: null,
    trackNumber: null,
    file: null,
    ...extra,
  });

  const otherDetails = async (ids: readonly string[], viewer: Viewer): Promise<MediaDetails[]> => {
    const many: Page = { limit: ids.length, after: null };
    const [seriesFound, artistsFound, albumsFound, booksFound] = await Promise.all([
      seriesRefs(inArray(series.id, [...ids]), viewer, many),
      artistRefs(inArray(musicArtist.id, [...ids]), viewer, many),
      albumRefs(inArray(musicAlbum.id, [...ids]), viewer, many),
      bookRefs(inArray(book.id, [...ids]), viewer, many),
    ]);
    const [seriesRows, artistRows, albumRows, bookRows] = await Promise.all([
      seriesFound.length === 0
        ? []
        : db
            .select({ id: series.id, addedAt: series.addedAt })
            .from(series)
            .where(
              inArray(
                series.id,
                seriesFound.map((ref) => ref.id),
              ),
            ),
      artistsFound.length === 0
        ? []
        : db
            .select({ id: musicArtist.id, addedAt: musicArtist.addedAt })
            .from(musicArtist)
            .where(
              inArray(
                musicArtist.id,
                artistsFound.map((ref) => ref.id),
              ),
            ),
      albumsFound.length === 0
        ? []
        : db
            .select({
              id: musicAlbum.id,
              addedAt: musicAlbum.addedAt,
              genres: musicAlbum.genres,
              artistId: musicAlbum.artistId,
            })
            .from(musicAlbum)
            .where(
              inArray(
                musicAlbum.id,
                albumsFound.map((ref) => ref.id),
              ),
            ),
      booksFound.length === 0
        ? []
        : db
            .select({
              id: book.id,
              addedAt: book.addedAt,
              overview: book.overview,
              genres: book.genres,
              rating: book.rating,
            })
            .from(book)
            .where(
              inArray(
                book.id,
                booksFound.map((ref) => ref.id),
              ),
            ),
    ]);

    return [
      ...seriesFound.map((ref) =>
        plainDetails(ref, {
          addedAt: seriesRows.find((row) => row.id === ref.id)?.addedAt.toISOString() ?? null,
        }),
      ),
      ...artistsFound.map((ref) =>
        plainDetails(ref, {
          addedAt: artistRows.find((row) => row.id === ref.id)?.addedAt.toISOString() ?? null,
        }),
      ),
      ...albumsFound.map((ref) => {
        const row = albumRows.find((each) => each.id === ref.id);

        return plainDetails(ref, {
          addedAt: row?.addedAt.toISOString() ?? null,
          genres: NamesSchema.parse(row?.genres),
          artistId: row?.artistId ?? null,
        });
      }),
      ...booksFound.map((ref) => {
        const row = bookRows.find((each) => each.id === ref.id);

        return plainDetails(ref, {
          addedAt: row?.addedAt.toISOString() ?? null,
          overview: row?.overview ?? null,
          genres: NamesSchema.parse(row?.genres),
          communityRating: row?.rating ?? null,
        });
      }),
    ];
  };

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
          artistRefs(eq(musicArtist.id, mediaId), viewer),
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
        wanted.includes('artist')
          ? artistRefs(containsInsensitively(musicArtist.name, pattern), viewer)
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
        case 'musicbrainz': {
          const found = await Promise.all([
            artistRefs(eq(musicArtist.musicbrainzId, id), viewer),
            albumRefs(
              or(eq(musicAlbum.musicbrainzId, id), eq(musicAlbum.releaseGroupMusicbrainzId, id)),
              viewer,
            ),
          ]);

          return found.flat();
        }
        case 'anilist':
          return /^\d+$/.test(id) ? seriesRefs(eq(series.anilistId, Number(id)), viewer) : [];
        case 'mal':
          return /^\d+$/.test(id) ? seriesRefs(eq(series.malId, Number(id)), viewer) : [];
        case 'isrc':
        case 'tvdb':
          return [];
      }
    },
    episodes: episodesOf,
    list: async ({ kind, after, limit }, viewer) => {
      const page: Page = { limit, after: after === null ? null : readMark(kind, after) };
      const found = await listOf(kind, viewer, page);
      const last = found.at(-1);

      return {
        items: found,
        next: found.length < limit || last === undefined ? null : markAfter(kind, last),
      };
    },
    children: async (id, viewer) => {
      const [isSeries, isAlbum, isArtist] = await Promise.all([
        db.select({ id: series.id }).from(series).where(eq(series.id, id)).limit(1),
        db.select({ id: musicAlbum.id }).from(musicAlbum).where(eq(musicAlbum.id, id)).limit(1),
        db.select({ id: musicArtist.id }).from(musicArtist).where(eq(musicArtist.id, id)).limit(1),
      ]);

      if (isSeries.length > 0) {
        return (await seriesRefs(eq(series.id, id), viewer)).length === 0
          ? []
          : (await episodesOf(id, viewer)).slice(0, MOST_CHILDREN);
      }

      if (isAlbum.length > 0) {
        return tracksOf(id, viewer);
      }

      if (isArtist.length > 0) {
        return (await artistRefs(eq(musicArtist.id, id), viewer)).length === 0
          ? []
          : albumRefs(
              or(
                eq(musicAlbum.artistId, id),
                inArray(
                  musicAlbum.id,
                  db
                    .select({ id: musicTrack.albumId })
                    .from(musicTrack)
                    .innerJoin(
                      musicTrackArtist,
                      eq(musicTrackArtist.mediaItemId, musicTrack.mediaItemId),
                    )
                    .where(eq(musicTrackArtist.artistId, id)),
                ),
              ),
              viewer,
              { limit: MOST_CHILDREN, after: null },
            );
      }

      return [];
    },
    details: async (ids, viewer) => {
      const unique = [...new Set(ids)];

      if (unique.length === 0) {
        return [];
      }

      const found = (
        await Promise.all([itemDetails(unique, viewer), otherDetails(unique, viewer)])
      ).flat();

      return unique.flatMap((id) => found.filter((each) => each.id === id));
    },
    sees: async (subject, viewer) => {
      if (subject.kind === 'artist') {
        return (await artistRefs(eq(musicArtist.id, subject.id), viewer)).length > 0;
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
        .where(and(isTheTrackNamed(track.title, track.artist), isStillThere(), inReach(viewer)))
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
