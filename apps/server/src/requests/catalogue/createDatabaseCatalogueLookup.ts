import { concatenated } from '@ValenceDatabase/concatenated';
import { and, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm';
import {
  book,
  library,
  linkedServer,
  mediaItem,
  musicAlbum,
  musicArtist,
  series,
} from '#dialect/Schema';
import { nameKey } from '@ValenceServer/music/nameKey';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { CatalogueLookup, NamedBook } from '@ValenceServer/requests/catalogue/CatalogueLookup';

/**
 * Pairs rows up by their key, the first of each kept, where any were asked about at all.
 *
 * @param keys - What was asked about.
 * @param read - How the rows are read.
 * @returns Each key with the id found for it.
 */
const byKey = async (
  keys: readonly string[],
  read: (wanted: string[]) => Promise<{ key: string | null; id: string }[]>,
): Promise<ReadonlyMap<string, string>> => {
  if (keys.length === 0) {
    return new Map();
  }

  const found = new Map<string, string>();

  for (const row of await read([...new Set(keys)])) {
    if (row.key !== null && !found.has(row.key)) {
      found.set(row.key, row.id);
    }
  }

  return found;
};

/**
 * The libraries, looked into for what a catalogue lists: films and series by their catalogue ids,
 * artists by their MusicBrainz ids or names, albums by their release groups or by their artist
 * and title together, and books by their author and title together.
 *
 * @param db - The database.
 * @returns The lookup.
 */
const createDatabaseCatalogueLookup = (db: AnyValenceDatabase): CatalogueLookup => ({
  films: (tmdbIds) =>
    byKey(tmdbIds, (wanted) =>
      db
        .select({ key: mediaItem.externalId, id: mediaItem.id })
        .from(mediaItem)
        .innerJoin(library, eq(library.id, mediaItem.libraryId))
        .where(
          and(
            inArray(mediaItem.externalId, wanted),
            isNull(mediaItem.seriesId),
            isNull(mediaItem.parentId),
            isNull(library.linkedServerId),
          ),
        ),
    ),

  series: (tmdbIds) =>
    byKey(tmdbIds, (wanted) =>
      db
        .select({ key: series.externalId, id: series.id })
        .from(series)
        .innerJoin(library, eq(library.id, series.libraryId))
        .where(and(inArray(series.externalId, wanted), isNull(library.linkedServerId))),
    ),

  episodesHeld: async (tmdbId) => {
    const rows = await db
      .select({
        season: mediaItem.seasonNumber,
        held: sql<number>`sum(case when ${mediaItem.episodeNumberEnd} > ${mediaItem.episodeNumber} then ${mediaItem.episodeNumberEnd} - ${mediaItem.episodeNumber} + 1 else 1 end)`.mapWith(
          Number,
        ),
      })
      .from(mediaItem)
      .innerJoin(series, eq(mediaItem.seriesId, series.id))
      .where(
        and(
          eq(series.externalId, tmdbId),
          isNotNull(mediaItem.episodeNumber),
          isNotNull(mediaItem.seasonNumber),
        ),
      )
      .groupBy(mediaItem.seasonNumber);

    return new Map(rows.flatMap((row) => (row.season === null ? [] : [[row.season, row.held]])));
  },

  artists: (musicBrainzIds) =>
    byKey(musicBrainzIds, (wanted) =>
      db
        .select({ key: musicArtist.musicbrainzId, id: musicArtist.id })
        .from(musicArtist)
        .innerJoin(library, eq(library.id, musicArtist.libraryId))
        .where(and(inArray(musicArtist.musicbrainzId, wanted), isNull(library.linkedServerId))),
    ),

  albums: (releaseGroupIds) =>
    byKey(releaseGroupIds, (wanted) =>
      db
        .select({ key: musicAlbum.releaseGroupMusicbrainzId, id: musicAlbum.id })
        .from(musicAlbum)
        .innerJoin(library, eq(library.id, musicAlbum.libraryId))
        .where(
          and(
            isNotNull(musicAlbum.releaseGroupMusicbrainzId),
            inArray(musicAlbum.releaseGroupMusicbrainzId, wanted),
            isNull(library.linkedServerId),
          ),
        ),
    ),

  artistsNamed: (nameKeys) =>
    byKey(nameKeys, (wanted) =>
      db
        .select({ key: musicArtist.nameKey, id: musicArtist.id })
        .from(musicArtist)
        .innerJoin(library, eq(library.id, musicArtist.libraryId))
        .where(and(inArray(musicArtist.nameKey, wanted), isNull(library.linkedServerId))),
    ),

  albumsNamed: (titleKeys) =>
    byKey(titleKeys, (wanted) =>
      db
        .select({
          key: concatenated(musicArtist.nameKey, '/', musicAlbum.titleKey),
          id: musicAlbum.id,
        })
        .from(musicAlbum)
        .innerJoin(musicArtist, eq(musicArtist.id, musicAlbum.artistId))
        .innerJoin(library, eq(library.id, musicAlbum.libraryId))
        .where(
          and(
            inArray(concatenated(musicArtist.nameKey, '/', musicAlbum.titleKey), wanted),
            isNull(library.linkedServerId),
          ),
        ),
    ),

  elsewhere: async (tmdbIds) => {
    if (tmdbIds.length === 0) {
      return new Map();
    }

    const wanted = [...new Set(tmdbIds)];
    const [films, programmes] = await Promise.all([
      db
        .select({ key: mediaItem.externalId, id: mediaItem.id, server: linkedServer.name })
        .from(mediaItem)
        .innerJoin(library, eq(library.id, mediaItem.libraryId))
        .innerJoin(linkedServer, eq(linkedServer.id, library.linkedServerId))
        .where(
          and(
            inArray(mediaItem.externalId, wanted),
            isNull(mediaItem.seriesId),
            isNull(mediaItem.parentId),
            eq(linkedServer.state, 'linked'),
          ),
        ),
      db
        .select({ key: series.externalId, id: series.id, server: linkedServer.name })
        .from(series)
        .innerJoin(library, eq(library.id, series.libraryId))
        .innerJoin(linkedServer, eq(linkedServer.id, library.linkedServerId))
        .where(and(inArray(series.externalId, wanted), eq(linkedServer.state, 'linked'))),
    ]);
    const found = new Map<string, { mediaId: string; fromServer: string }>();

    for (const row of [...films, ...programmes]) {
      if (row.key !== null && !found.has(row.key)) {
        found.set(row.key, { mediaId: row.id, fromServer: row.server });
      }
    }

    return found;
  },

  booksNamed: async (wanted: readonly NamedBook[]) => {
    if (wanted.length === 0) {
      return new Map();
    }

    const held = await db
      .select({ id: book.id, title: book.title, authors: book.authors })
      .from(book)
      .innerJoin(library, eq(library.id, book.libraryId))
      .where(
        and(
          inArray(sql`lower(${book.title})`, [
            ...new Set(wanted.map((one) => one.title.toLowerCase())),
          ]),
          isNull(library.linkedServerId),
        ),
      );

    const keys = new Set(wanted.map((one) => one.key));
    const found = new Map<string, string>();

    for (const row of held) {
      const authors = Array.isArray(row.authors) ? row.authors : [];

      for (const author of authors) {
        const key = `${nameKey(typeof author === 'string' ? author : '')}/${nameKey(row.title)}`;

        if (keys.has(key) && !found.has(key)) {
          found.set(key, row.id);
        }
      }
    }

    return found;
  },
});

export { createDatabaseCatalogueLookup };
