import { inArray } from 'drizzle-orm';
import { mediaItem, musicAlbum, series } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { HeldKind } from '@ValenceServer/requests/arrivals/HeldKind';

/**
 * Which of some films, series or albums the libraries still hold, by the ids requests arrived as.
 *
 * @param db - The database.
 * @returns How to ask.
 */
const createDatabaseLibraryHolds =
  (db: AnyValenceDatabase) =>
  async (kind: HeldKind, mediaIds: readonly string[]): Promise<ReadonlySet<string>> => {
    if (mediaIds.length === 0) {
      return new Set();
    }

    const wanted = [...new Set(mediaIds)];
    const table = { film: mediaItem, series, album: musicAlbum }[kind];
    const rows = await db.select({ id: table.id }).from(table).where(inArray(table.id, wanted));

    return new Set(rows.map((row) => row.id));
  };

export { createDatabaseLibraryHolds };
