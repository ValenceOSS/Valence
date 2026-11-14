import { inArray } from 'drizzle-orm';
import { insertUnlessPresent } from '@ValenceDatabase/insertUnlessPresent';
import { upsert } from '@ValenceDatabase/upsert';
import { mediaOrigin } from '#dialect/Schema';
import { RECORDED_SOURCES } from '@ValenceContracts/constants/RECORDED_SOURCES';
import type { RecordedSource } from '@ValenceContracts/schemas/MediaOrigin';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { MediaOriginStore } from '@ValenceServer/origins/MediaOriginStore';

const MOST_AT_ONCE = 500;

/**
 * Whether a source read back from the database is one the server records.
 *
 * @param source - What the row says.
 * @returns Whether it is an upload or an import.
 */
const isRecordedSource = (source: string): source is RecordedSource =>
  RECORDED_SOURCES.some((one) => one === source);

/**
 * Keeps where each library file came from when the server itself put it there or brought it
 * across, by its library and path, so a file listed later can say so.
 *
 * @param db - The database.
 * @returns The store.
 */
const createDatabaseMediaOriginStore = (db: AnyValenceDatabase): MediaOriginStore => ({
  record: async (origins) => {
    for (const origin of origins) {
      await upsert(db, mediaOrigin, {
        values: [{ ...origin, recordedAt: new Date() }],
        target: [mediaOrigin.libraryId, mediaOrigin.path],
        set: { source: origin.source, via: origin.via, recordedAt: new Date() },
      });
    }
  },

  recordUnlessKnown: async (origins) => {
    for (let at = 0; at < origins.length; at += MOST_AT_ONCE) {
      const some = origins.slice(at, at + MOST_AT_ONCE);

      if (some.length > 0) {
        await insertUnlessPresent(db, mediaOrigin, {
          values: some.map((origin) => ({ ...origin })),
          target: [mediaOrigin.libraryId, mediaOrigin.path],
        });
      }
    }
  },

  read: async (paths) => {
    if (paths.length === 0) {
      return {};
    }

    const rows = await db
      .select({ path: mediaOrigin.path, source: mediaOrigin.source, via: mediaOrigin.via })
      .from(mediaOrigin)
      .where(inArray(mediaOrigin.path, [...paths]));

    return Object.fromEntries(
      rows.flatMap((row) =>
        isRecordedSource(row.source) ? [[row.path, { source: row.source, via: row.via }]] : [],
      ),
    );
  },
});

export { createDatabaseMediaOriginStore };
