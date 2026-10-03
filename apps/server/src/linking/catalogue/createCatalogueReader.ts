import { and, asc, eq, gt, inArray } from 'drizzle-orm';
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
import { SHARED_ELSEWHERE } from './SHARED_ELSEWHERE';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import { CataloguePageSchema } from './CataloguePageSchema';
import type { CataloguePage } from './CataloguePageSchema';

const PAGE = 200;

const NOTHING = {
  series: [],
  mediaItems: [],
  artists: [],
  albums: [],
  tracks: [],
  trackArtists: [],
  books: [],
  chapters: [],
};

/**
 * Where this server keeps something, said only as whether it has it — a linked server is told that a
 * title has a poster or a book has a cover, never where on this server's disks either is.
 *
 * @param value - The path or address.
 * @returns A mark that there is one, or nothing where there is not.
 */
const hidden = (value: string | null): string | null => (value === null ? null : SHARED_ELSEWHERE);

/**
 * Reads one shared library's catalogue a page at a time, for a linked server to keep an index of:
 * its titles, programmes, songs, albums, artists, books and chapters — everything a page of the
 * library shows, and nothing it plays. Paged by id, so a page is the same however many times it is
 * read, and the other server knows a title has gone when a whole pass no longer brings it. Each
 * page is read through the same schema the other server reads it with, so nothing leaves that it
 * would not accept.
 *
 * @param db - The database.
 * @returns A reader of a page, after the id the last one ended on, or nothing where there is no
 *   such library.
 */
const createCatalogueReader =
  (db: AnyValenceDatabase) =>
  async (libraryId: string, after: string | null): Promise<CataloguePage | null> => {
    const [shelf] = await db
      .select({ kind: library.kind })
      .from(library)
      .where(eq(library.id, libraryId));

    if (shelf === undefined) {
      return null;
    }

    if (shelf.kind === 'books') {
      const books = await db
        .select()
        .from(book)
        .where(and(eq(book.libraryId, libraryId), after === null ? undefined : gt(book.id, after)))
        .orderBy(asc(book.id))
        .limit(PAGE);
      const chapters =
        books.length === 0
          ? []
          : await db
              .select()
              .from(bookChapter)
              .where(
                inArray(
                  bookChapter.bookId,
                  books.map((one) => one.id),
                ),
              );

      return CataloguePageSchema.parse({
        ...NOTHING,
        books: books.map((one) => ({
          ...one,
          path: SHARED_ELSEWHERE,
          posterUrl: hidden(one.posterUrl),
        })),
        chapters: chapters.map((one) => ({ ...one, path: SHARED_ELSEWHERE })),
        next: books.length === PAGE ? (books.at(-1)?.id ?? null) : null,
      });
    }

    const items = await db
      .select()
      .from(mediaItem)
      .where(
        and(
          eq(mediaItem.libraryId, libraryId),
          after === null ? undefined : gt(mediaItem.id, after),
        ),
      )
      .orderBy(asc(mediaItem.id))
      .limit(PAGE);
    const itemIds = items.map((item) => item.id);
    const seriesIds = [
      ...new Set(items.flatMap((item) => (item.seriesId === null ? [] : [item.seriesId]))),
    ];
    const programmes =
      seriesIds.length === 0
        ? []
        : await db.select().from(series).where(inArray(series.id, seriesIds));
    const tracks =
      shelf.kind !== 'music' || itemIds.length === 0
        ? []
        : await db.select().from(musicTrack).where(inArray(musicTrack.mediaItemId, itemIds));
    const trackArtists =
      tracks.length === 0
        ? []
        : await db
            .select()
            .from(musicTrackArtist)
            .where(inArray(musicTrackArtist.mediaItemId, itemIds));
    const albumIds = [...new Set(tracks.map((track) => track.albumId))];
    const albums =
      albumIds.length === 0
        ? []
        : await db.select().from(musicAlbum).where(inArray(musicAlbum.id, albumIds));
    const artistIds = [
      ...new Set([
        ...albums.map((album) => album.artistId),
        ...trackArtists.map((credit) => credit.artistId),
      ]),
    ];
    const artists =
      artistIds.length === 0
        ? []
        : await db.select().from(musicArtist).where(inArray(musicArtist.id, artistIds));

    return CataloguePageSchema.parse({
      ...NOTHING,
      series: programmes,
      mediaItems: items.map((item) => ({
        ...item,
        path: SHARED_ELSEWHERE,
        posterUrl: hidden(item.posterUrl),
        backdropUrl: hidden(item.backdropUrl),
        logoUrl: hidden(item.logoUrl),
      })),
      artists: artists.map((artist) => ({ ...artist, imagePath: hidden(artist.imagePath) })),
      albums: albums.map((album) => ({ ...album, artworkPath: hidden(album.artworkPath) })),
      tracks,
      trackArtists,
      next: items.length === PAGE ? (items.at(-1)?.id ?? null) : null,
    });
  };

export { createCatalogueReader };
