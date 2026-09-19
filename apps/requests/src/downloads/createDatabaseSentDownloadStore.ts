import { eq } from 'drizzle-orm';
import { sentDownload } from '@ValenceRequests/db/Schema';
import type { RequestsDatabase } from '@ValenceRequests/db/Database';
import type {
  SentDownloadRecord,
  SentDownloadStore,
} from '@ValenceRequests/downloads/SentDownloadRecord';

type SentDownloadRow = typeof sentDownload.$inferSelect;

/**
 * Reads a row as the record everything else deals in, with its moments written as the contract
 * writes them.
 *
 * @param row - The row.
 * @returns The record.
 */
const asRecord = (row: SentDownloadRow): SentDownloadRecord => ({
  ...row,
  sentAt: row.sentAt.toISOString(),
  finishedAt: row.finishedAt?.toISOString() ?? null,
  updatedAt: row.updatedAt.toISOString(),
});

/**
 * What Valence has handed to a download client, kept in the service's own schema so the queue
 * outlives a restart.
 *
 * @param db - The database.
 * @returns The store.
 */
const createDatabaseSentDownloadStore = (db: RequestsDatabase): SentDownloadStore => ({
  list: async () => (await db.select().from(sentDownload)).map(asRecord),

  find: async (id) => {
    const [row] = await db.select().from(sentDownload).where(eq(sentDownload.id, id));

    return row === undefined ? null : asRecord(row);
  },

  insert: async (record) => {
    const [row] = await db
      .insert(sentDownload)
      .values({
        ...record,
        sentAt: new Date(record.sentAt),
        finishedAt: record.finishedAt === null ? null : new Date(record.finishedAt),
        updatedAt: new Date(record.updatedAt),
      })
      .returning();

    return row === undefined ? record : asRecord(row);
  },

  update: async (id, changes) => {
    const { sentAt, finishedAt, updatedAt, ...rest } = changes;
    const [row] = await db
      .update(sentDownload)
      .set({
        ...rest,
        ...(sentAt === undefined ? {} : { sentAt: new Date(sentAt) }),
        ...(finishedAt === undefined
          ? {}
          : { finishedAt: finishedAt === null ? null : new Date(finishedAt) }),
        ...(updatedAt === undefined ? {} : { updatedAt: new Date(updatedAt) }),
      })
      .where(eq(sentDownload.id, id))
      .returning();

    return row === undefined ? null : asRecord(row);
  },

  remove: async (id) =>
    (
      await db
        .delete(sentDownload)
        .where(eq(sentDownload.id, id))
        .returning({ id: sentDownload.id })
    ).length > 0,
});

export { createDatabaseSentDownloadStore };
