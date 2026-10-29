import { and, count, eq, isNotNull, isNull, or } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { book, library, mediaItem, musicTrack } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';

type LibraryCounts = {
  films: number;
  episodes: number;
  tracks: number;
  books: number;
};

/**
 * Counts what this server's own libraries hold, one count at a time: films, episodes, songs and
 * books still where the library found them, leaving out extras, other versions of a title, linked
 * servers' libraries and the hidden one streamed films are kept in.
 *
 * @param db - The database to count in.
 * @returns How many of each there are.
 */
const countTelemetryLibrary = async (db: AnyValenceDatabase): Promise<LibraryCounts> => {
  const ownLibrary = and(isNull(library.linkedServerId), eq(library.isStreamed, false));
  const aTitle = and(
    isNull(mediaItem.extraKind),
    isNull(mediaItem.parentId),
    isNull(mediaItem.missingSince),
  );

  const countItems = async (which: SQL | undefined): Promise<number> => {
    const [row] = await db
      .select({ total: count() })
      .from(mediaItem)
      .innerJoin(library, eq(library.id, mediaItem.libraryId))
      .where(and(ownLibrary, aTitle, which));

    return row?.total ?? 0;
  };

  const countTracks = async (): Promise<number> => {
    const [row] = await db
      .select({ total: count() })
      .from(musicTrack)
      .innerJoin(mediaItem, eq(mediaItem.id, musicTrack.mediaItemId))
      .innerJoin(library, eq(library.id, mediaItem.libraryId))
      .where(and(ownLibrary, isNull(mediaItem.missingSince)));

    return row?.total ?? 0;
  };

  const countBooks = async (): Promise<number> => {
    const [row] = await db
      .select({ total: count() })
      .from(book)
      .innerJoin(library, eq(library.id, book.libraryId))
      .where(ownLibrary);

    return row?.total ?? 0;
  };

  const films = await countItems(
    or(eq(library.kind, 'movies'), and(eq(library.kind, 'anime'), isNull(mediaItem.episodeNumber))),
  );
  const episodes = await countItems(
    or(
      eq(library.kind, 'shows'),
      and(eq(library.kind, 'anime'), isNotNull(mediaItem.episodeNumber)),
    ),
  );
  const tracks = await countTracks();
  const books = await countBooks();

  return { films, episodes, tracks, books };
};

export type { LibraryCounts };

export { countTelemetryLibrary };
