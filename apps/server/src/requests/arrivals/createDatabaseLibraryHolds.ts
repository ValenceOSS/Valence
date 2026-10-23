import { isStillThere } from '@ValenceServer/visibility/isStillThere';
import { hasSomethingStillThere } from '@ValenceServer/visibility/hasSomethingStillThere';
import { and, inArray } from 'drizzle-orm';
import { mediaItem, musicAlbum, series } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { HeldKind } from '@ValenceServer/requests/arrivals/HeldKind';

/**
 * Which of some films, series or albums the libraries still hold, by the ids requests arrived as.
 * A film whose file has gone missing, or a series whose every file has, is no longer held.
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
    const rows =
      kind === 'film'
        ? await db
            .select({ id: mediaItem.id })
            .from(mediaItem)
            .where(and(inArray(mediaItem.id, wanted), isStillThere()))
        : kind === 'series'
          ? await db
              .select({ id: series.id })
              .from(series)
              .where(and(inArray(series.id, wanted), hasSomethingStillThere(db)))
          : await db
              .select({ id: musicAlbum.id })
              .from(musicAlbum)
              .where(inArray(musicAlbum.id, wanted));

    return new Set(rows.map((row) => row.id));
  };

export { createDatabaseLibraryHolds };
