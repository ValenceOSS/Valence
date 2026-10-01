import { countAffected } from '@ValenceDatabase/countAffected';
import { eq } from 'drizzle-orm';
import { mediaRequest } from '#dialect/Schema';
import type { RequestsDatabase } from '#dialect/RequestsDatabase';
import type {
  MediaRequestRecord,
  MediaRequestStore,
} from '@ValenceRequests/mediaRequests/MediaRequestRecord';

type MediaRequestRow = typeof mediaRequest.$inferSelect;

/**
 * Reads a row as the record everything else deals in, with its moments written as the contract
 * writes them.
 *
 * @param row - The row.
 * @returns The record.
 */
const asRecord = (row: MediaRequestRow): MediaRequestRecord => ({
  ...row,
  catalogueCheckedAt: row.catalogueCheckedAt.toISOString(),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

/**
 * Requests for films and series, kept in the service's own schema.
 *
 * @param db - The database.
 * @returns The store.
 */
const createDatabaseMediaRequestStore = (db: RequestsDatabase): MediaRequestStore => ({
  list: async () => (await db.select().from(mediaRequest)).map(asRecord),

  find: async (id) => {
    const [row] = await db.select().from(mediaRequest).where(eq(mediaRequest.id, id));

    return row === undefined ? null : asRecord(row);
  },

  insert: async (record) => {
    await db.insert(mediaRequest).values({
      ...record,
      catalogueCheckedAt: new Date(record.catalogueCheckedAt),
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
    });
    const [row] = await db.select().from(mediaRequest).where(eq(mediaRequest.id, record.id));

    return row === undefined ? record : asRecord(row);
  },

  update: async (id, changes) => {
    const { catalogueCheckedAt, createdAt, updatedAt, ...rest } = changes;
    await db
      .update(mediaRequest)
      .set({
        ...rest,
        ...(catalogueCheckedAt === undefined
          ? {}
          : { catalogueCheckedAt: new Date(catalogueCheckedAt) }),
        ...(createdAt === undefined ? {} : { createdAt: new Date(createdAt) }),
        ...(updatedAt === undefined ? {} : { updatedAt: new Date(updatedAt) }),
      })
      .where(eq(mediaRequest.id, id));
    const [row] = await db.select().from(mediaRequest).where(eq(mediaRequest.id, id));

    return row === undefined ? null : asRecord(row);
  },

  remove: async (id) =>
    countAffected(await db.delete(mediaRequest).where(eq(mediaRequest.id, id))) > 0,
});

export { createDatabaseMediaRequestStore };
