import { countAffected } from '@ValenceDatabase/countAffected';
import { eq } from 'drizzle-orm';
import { arrApp } from '#dialect/Schema';
import type { RequestsDatabase } from '#dialect/RequestsDatabase';
import type { ArrAppRecord, ArrAppStore } from '@ValenceRequests/arrApps/ArrAppRecord';

type ArrAppRow = typeof arrApp.$inferSelect;

/**
 * Reads a row as the record everything else deals in, with its moments written as the contract
 * writes them.
 *
 * @param row - The row.
 * @returns The record.
 */
const asRecord = (row: ArrAppRow): ArrAppRecord => ({
  ...row,
  lastCheckedAt: row.lastCheckedAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

/**
 * Connected Radarr, Sonarr, Lidarr and Prowlarr apps, kept in the service's own schema.
 *
 * @param db - The database.
 * @returns The store.
 */
const createDatabaseArrAppStore = (db: RequestsDatabase): ArrAppStore => {
  const find = async (id: string) => {
    const [row] = await db.select().from(arrApp).where(eq(arrApp.id, id));

    return row === undefined ? null : asRecord(row);
  };

  return {
    list: async () => (await db.select().from(arrApp)).map(asRecord),

    find,

    insert: async (record) => {
      await db.insert(arrApp).values({
        ...record,
        lastCheckedAt: record.lastCheckedAt === null ? null : new Date(record.lastCheckedAt),
        createdAt: new Date(record.createdAt),
        updatedAt: new Date(record.updatedAt),
      });

      return (await find(record.id)) ?? record;
    },

    update: async (id, changes) => {
      const { lastCheckedAt, createdAt, updatedAt, ...rest } = changes;

      await db
        .update(arrApp)
        .set({
          ...rest,
          ...(lastCheckedAt === undefined
            ? {}
            : { lastCheckedAt: lastCheckedAt === null ? null : new Date(lastCheckedAt) }),
          ...(createdAt === undefined ? {} : { createdAt: new Date(createdAt) }),
          ...(updatedAt === undefined ? {} : { updatedAt: new Date(updatedAt) }),
        })
        .where(eq(arrApp.id, id));

      return find(id);
    },

    remove: async (id) => countAffected(await db.delete(arrApp).where(eq(arrApp.id, id))) > 0,
  };
};

export { createDatabaseArrAppStore };
