import { eq } from 'drizzle-orm';
import { requestItem } from '@ValenceRequests/db/Schema';
import type { RequestsDatabase } from '@ValenceRequests/db/Database';
import type {
  RequestItemRecord,
  RequestItemStore,
} from '@ValenceRequests/mediaRequests/RequestItemRecord';

type RequestItemRow = typeof requestItem.$inferSelect;

/**
 * Reads a row as the record everything else deals in, with its moments written as the contract
 * writes them.
 *
 * @param row - The row.
 * @returns The record.
 */
const asRecord = (row: RequestItemRow): RequestItemRecord => ({
  ...row,
  lastSearchedAt: row.lastSearchedAt?.toISOString() ?? null,
  updatedAt: row.updatedAt.toISOString(),
});

/**
 * What each request is waiting for — a film, or each of a series' episodes — kept in the service's
 * own schema.
 *
 * @param db - The database.
 * @returns The store.
 */
const createDatabaseRequestItemStore = (db: RequestsDatabase): RequestItemStore => ({
  list: async () => (await db.select().from(requestItem)).map(asRecord),

  find: async (id) => {
    const [row] = await db.select().from(requestItem).where(eq(requestItem.id, id));

    return row === undefined ? null : asRecord(row);
  },

  insert: async (record) => {
    const [row] = await db
      .insert(requestItem)
      .values({
        ...record,
        lastSearchedAt: record.lastSearchedAt === null ? null : new Date(record.lastSearchedAt),
        updatedAt: new Date(record.updatedAt),
      })
      .returning();

    return row === undefined ? record : asRecord(row);
  },

  update: async (id, changes) => {
    const { lastSearchedAt, updatedAt, ...rest } = changes;
    const [row] = await db
      .update(requestItem)
      .set({
        ...rest,
        ...(lastSearchedAt === undefined
          ? {}
          : { lastSearchedAt: lastSearchedAt === null ? null : new Date(lastSearchedAt) }),
        ...(updatedAt === undefined ? {} : { updatedAt: new Date(updatedAt) }),
      })
      .where(eq(requestItem.id, id))
      .returning();

    return row === undefined ? null : asRecord(row);
  },

  remove: async (id) =>
    (await db.delete(requestItem).where(eq(requestItem.id, id)).returning({ id: requestItem.id }))
      .length > 0,
});

export { createDatabaseRequestItemStore };
