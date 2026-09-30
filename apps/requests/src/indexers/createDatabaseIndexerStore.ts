import { countAffected } from '@ValenceDatabase/countAffected';
import { eq } from 'drizzle-orm';
import { indexer } from '#dialect/Schema';
import type { RequestsDatabase } from '#dialect/RequestsDatabase';
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
    await db.insert(indexer).values({
      ...record,
      lastFailedAt: record.lastFailedAt === null ? null : new Date(record.lastFailedAt),
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
    });
    const [row] = await db.select().from(indexer).where(eq(indexer.id, record.id));

    return row === undefined ? record : asRecord(row);
  },

  update: async (id, changes) => {
    const { lastFailedAt, createdAt, updatedAt, ...rest } = changes;
    await db
      .update(indexer)
      .set({
        ...rest,
        ...(lastFailedAt === undefined
          ? {}
          : { lastFailedAt: lastFailedAt === null ? null : new Date(lastFailedAt) }),
        ...(createdAt === undefined ? {} : { createdAt: new Date(createdAt) }),
        ...(updatedAt === undefined ? {} : { updatedAt: new Date(updatedAt) }),
      })
      .where(eq(indexer.id, id));
    const [row] = await db.select().from(indexer).where(eq(indexer.id, id));

    return row === undefined ? null : asRecord(row);
  },

  remove: async (id) => countAffected(await db.delete(indexer).where(eq(indexer.id, id))) > 0,
});

export { createDatabaseIndexerStore };
