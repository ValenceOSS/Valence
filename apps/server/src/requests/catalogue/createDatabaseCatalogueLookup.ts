import { and, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm';
import { book, mediaItem, musicAlbum, musicArtist, series } from '@ValenceServer/db/Schema';
import { nameKey } from '@ValenceServer/music/nameKey';
import type { ValenceDatabase } from '@ValenceServer/db/Database';
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
const createDatabaseCatalogueLookup = (db: ValenceDatabase): CatalogueLookup => ({
  films: (tmdbIds) =>
    byKey(tmdbIds, (wanted) =>
      db
        .select({ key: mediaItem.externalId, id: mediaItem.id })
        .from(mediaItem)
        .where(
          and(
            inArray(mediaItem.externalId, wanted),
            isNull(mediaItem.seriesId),
            isNull(mediaItem.parentId),
          ),
        ),
    ),

  series: (tmdbIds) =>
    byKey(tmdbIds, (wanted) =>
      db
        .select({ key: series.externalId, id: series.id })
        .from(series)
        .where(inArray(series.externalId, wanted)),
    ),

  artists: (musicBrainzIds) =>
    byKey(musicBrainzIds, (wanted) =>
      db
        .select({ key: musicArtist.musicbrainzId, id: musicArtist.id })
        .from(musicArtist)
        .where(inArray(musicArtist.musicbrainzId, wanted)),
    ),

  albums: (releaseGroupIds) =>
    byKey(releaseGroupIds, (wanted) =>
      db
        .select({ key: musicAlbum.releaseGroupMusicbrainzId, id: musicAlbum.id })
        .from(musicAlbum)
        .where(
          and(
            isNotNull(musicAlbum.releaseGroupMusicbrainzId),
            inArray(musicAlbum.releaseGroupMusicbrainzId, wanted),
          ),
        ),
    ),

  artistsNamed: (nameKeys) =>
    byKey(nameKeys, (wanted) =>
      db
        .select({ key: musicArtist.nameKey, id: musicArtist.id })
        .from(musicArtist)
        .where(inArray(musicArtist.nameKey, wanted)),
    ),

  albumsNamed: (titleKeys) =>
    byKey(titleKeys, (wanted) =>
      db
        .select({
          key: sql<string>`${musicArtist.nameKey} || '/' || ${musicAlbum.titleKey}`,
          id: musicAlbum.id,
        })
        .from(musicAlbum)
        .innerJoin(musicArtist, eq(musicArtist.id, musicAlbum.artistId))
        .where(inArray(sql`${musicArtist.nameKey} || '/' || ${musicAlbum.titleKey}`, wanted)),
    ),

  booksNamed: async (wanted: readonly NamedBook[]) => {
    if (wanted.length === 0) {
      return new Map();
    }

    const held = await db
      .select({ id: book.id, title: book.title, authors: book.authors })
      .from(book)
      .where(
        inArray(sql`lower(${book.title})`, [
          ...new Set(wanted.map((one) => one.title.toLowerCase())),
        ]),
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
