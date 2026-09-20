import { and, desc, eq, lt } from 'drizzle-orm';
import { requestLog } from '@ValenceRequests/db/Schema';
import type { RequestsDatabase } from '@ValenceRequests/db/Database';
import type { RequestLogStore } from '@ValenceRequests/mediaRequests/RequestLogStore';

const KEPT = 200;

/**
 * What each request has done — every search, what it found and why it was taken or refused, and
 * what became of what was sent — kept in the service's own schema, the newest two hundred lines of
 * each request.
 *
 * @param db - The database.
 * @returns The store.
 */
const createDatabaseRequestLogStore = (db: RequestsDatabase): RequestLogStore => ({
  add: async (requestId, message) => {
    await db.insert(requestLog).values({ requestId, message });

    const [oldest] = await db
      .select({ id: requestLog.id })
      .from(requestLog)
      .where(eq(requestLog.requestId, requestId))
      .orderBy(desc(requestLog.id))
      .offset(KEPT - 1)
      .limit(1);

    if (oldest !== undefined) {
      await db
        .delete(requestLog)
        .where(and(eq(requestLog.requestId, requestId), lt(requestLog.id, oldest.id)));
    }
  },

  list: async (requestId) =>
    (
      await db
        .select()
        .from(requestLog)
        .where(eq(requestLog.requestId, requestId))
        .orderBy(desc(requestLog.id))
    ).map((row) => ({ id: row.id, at: row.at.toISOString(), message: row.message })),
});

export { createDatabaseRequestLogStore };
