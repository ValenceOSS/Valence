import { asc, inArray } from 'drizzle-orm';
import { downloadEvent } from '@ValenceRequests/db/Schema';
import type { RequestsDatabase } from '@ValenceRequests/db/Database';
import type { DownloadEventStore } from '@ValenceRequests/downloads/DownloadEventStore';

type DownloadEventRow = typeof downloadEvent.$inferSelect;

const OLDEST_FIRST = asc(downloadEvent.id);

/**
 * Reads a row as the event the server is told of.
 *
 * @param row - The row.
 * @returns The event.
 */
const asEvent = (row: DownloadEventRow) => ({ ...row, at: row.at.toISOString() });

/**
 * Events waiting for the server to hear of them, kept until it says it has, so a webhook is not
 * lost to a restart of either.
 *
 * @param db - The database.
 * @returns The store.
 */
const createDatabaseDownloadEventStore = (db: RequestsDatabase): DownloadEventStore => ({
  add: async (event) => {
    const [row] = await db.insert(downloadEvent).values(event).returning();

    if (row === undefined) {
      throw new Error('The event was not kept');
    }

    return asEvent(row);
  },

  pending: async () => (await db.select().from(downloadEvent).orderBy(OLDEST_FIRST)).map(asEvent),

  acknowledge: async (ids) => {
    if (ids.length > 0) {
      await db.delete(downloadEvent).where(inArray(downloadEvent.id, [...ids]));
    }
  },
});

export { createDatabaseDownloadEventStore };
