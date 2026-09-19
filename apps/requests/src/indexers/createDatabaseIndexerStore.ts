import { eq } from 'drizzle-orm';
import { indexer } from '@ValenceRequests/db/Schema';
import type { RequestsDatabase } from '@ValenceRequests/db/Database';
import type { IndexerRecord, IndexerStore } from '@ValenceRequests/indexers/IndexerRecord';

type IndexerRow = typeof indexer.$inferSelect;

/**
 * Reads a row as the record everything else deals in, with its moments written as the contract
 * writes them.
 *
 * @param row - The row.
 * @returns The record.
 */
const asRecord = (row: IndexerRow): IndexerRecord => ({
  ...row,
  lastFailedAt: row.lastFailedAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

/**
 * Indexers kept in the service's own schema.
 *
 * @param db - The database.
 * @returns The store.
 */
const createDatabaseIndexerStore = (db: RequestsDatabase): IndexerStore => ({
  list: async () => (await db.select().from(indexer)).map(asRecord),

  find: async (id) => {
    const [row] = await db.select().from(indexer).where(eq(indexer.id, id));

    return row === undefined ? null : asRecord(row);
  },

  insert: async (record) => {
    const [row] = await db
      .insert(indexer)
      .values({
        ...record,
        lastFailedAt: record.lastFailedAt === null ? null : new Date(record.lastFailedAt),
        createdAt: new Date(record.createdAt),
        updatedAt: new Date(record.updatedAt),
      })
      .returning();

    return row === undefined ? record : asRecord(row);
  },

  update: async (id, changes) => {
    const { lastFailedAt, createdAt, updatedAt, ...rest } = changes;
    const [row] = await db
      .update(indexer)
      .set({
        ...rest,
        ...(lastFailedAt === undefined
          ? {}
          : { lastFailedAt: lastFailedAt === null ? null : new Date(lastFailedAt) }),
        ...(createdAt === undefined ? {} : { createdAt: new Date(createdAt) }),
        ...(updatedAt === undefined ? {} : { updatedAt: new Date(updatedAt) }),
      })
      .where(eq(indexer.id, id))
      .returning();

    return row === undefined ? null : asRecord(row);
  },

  remove: async (id) =>
    (await db.delete(indexer).where(eq(indexer.id, id)).returning({ id: indexer.id })).length > 0,
});

export { createDatabaseIndexerStore };
