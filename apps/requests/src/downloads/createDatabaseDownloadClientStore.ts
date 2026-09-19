import { eq } from 'drizzle-orm';
import { downloadClient } from '@ValenceRequests/db/Schema';
import type { RequestsDatabase } from '@ValenceRequests/db/Database';
import type {
  DownloadClientRecord,
  DownloadClientStore,
} from '@ValenceRequests/downloads/DownloadClientRecord';

type DownloadClientRow = typeof downloadClient.$inferSelect;

/**
 * Reads a row as the record everything else deals in, with its moments written as the contract
 * writes them.
 *
 * @param row - The row.
 * @returns The record.
 */
const asRecord = (row: DownloadClientRow): DownloadClientRecord => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

/**
 * Download clients kept in the service's own schema.
 *
 * @param db - The database.
 * @returns The store.
 */
const createDatabaseDownloadClientStore = (db: RequestsDatabase): DownloadClientStore => ({
  list: async () => (await db.select().from(downloadClient)).map(asRecord),

  find: async (id) => {
    const [row] = await db.select().from(downloadClient).where(eq(downloadClient.id, id));

    return row === undefined ? null : asRecord(row);
  },

  insert: async (record) => {
    const [row] = await db
      .insert(downloadClient)
      .values({
        ...record,
        createdAt: new Date(record.createdAt),
        updatedAt: new Date(record.updatedAt),
      })
      .returning();

    return row === undefined ? record : asRecord(row);
  },

  update: async (id, changes) => {
    const { createdAt, updatedAt, ...rest } = changes;
    const [row] = await db
      .update(downloadClient)
      .set({
        ...rest,
        ...(createdAt === undefined ? {} : { createdAt: new Date(createdAt) }),
        ...(updatedAt === undefined ? {} : { updatedAt: new Date(updatedAt) }),
      })
      .where(eq(downloadClient.id, id))
      .returning();

    return row === undefined ? null : asRecord(row);
  },

  remove: async (id) =>
    (
      await db
        .delete(downloadClient)
        .where(eq(downloadClient.id, id))
        .returning({ id: downloadClient.id })
    ).length > 0,
});

export { createDatabaseDownloadClientStore };
