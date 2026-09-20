import { asc, inArray } from 'drizzle-orm';
import { ServiceEventSchema } from '@ValenceContracts/schemas/DownloadQueue';
import { serviceEvent } from '@ValenceRequests/db/Schema';
import type { ServiceEvent } from '@ValenceContracts/schemas/DownloadQueue';
import type { RequestsDatabase } from '@ValenceRequests/db/Database';
import type { EventStore } from '@ValenceRequests/events/EventStore';

type ServiceEventRow = typeof serviceEvent.$inferSelect;

const OLDEST_FIRST = asc(serviceEvent.id);

/**
 * Reads a row as the event the server is told of: its kind and title in columns, and whatever else
 * that kind carries in its details. Rows kept before details were, held the client and the problem
 * in columns of their own, so those are read too.
 *
 * @param row - The row.
 * @returns The event, or null where the row is not one.
 */
const asEvent = (row: ServiceEventRow): ServiceEvent | null => {
  const read = ServiceEventSchema.safeParse({
    ...(row.clientName === null ? {} : { clientName: row.clientName }),
    ...(row.problem === null ? {} : { problem: row.problem }),
    ...row.details,
    id: row.id,
    kind: row.kind,
    title: row.title,
    at: row.at.toISOString(),
  });

  return read.success ? read.data : null;
};

/**
 * Events waiting for the server to hear of them, kept until it says it has, so a webhook or a
 * notification is not lost to a restart of either.
 *
 * @param db - The database.
 * @returns The store.
 */
const createDatabaseEventStore = (db: RequestsDatabase): EventStore => ({
  add: async ({ kind, title, ...details }) => {
    const [row] = await db
      .insert(serviceEvent)
      .values({ kind, title, details, clientName: null, problem: null })
      .returning();
    const event = row === undefined ? null : asEvent(row);

    if (event === null) {
      throw new Error('The event was not kept');
    }

    return event;
  },

  pending: async () =>
    (await db.select().from(serviceEvent).orderBy(OLDEST_FIRST)).flatMap((row) => {
      const event = asEvent(row);

      return event === null ? [] : [event];
    }),

  acknowledge: async (ids) => {
    if (ids.length > 0) {
      await db.delete(serviceEvent).where(inArray(serviceEvent.id, [...ids]));
    }
  },
});

export { createDatabaseEventStore };
