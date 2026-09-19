import { eq } from 'drizzle-orm';
import { blocklistedRelease } from '@ValenceRequests/db/Schema';
import type { RequestsDatabase } from '@ValenceRequests/db/Database';
import type {
  BlockedReleaseRecord,
  BlockedReleaseStore,
} from '@ValenceRequests/mediaRequests/BlockedReleaseRecord';

type BlockedReleaseRow = typeof blocklistedRelease.$inferSelect;

/**
 * Reads a row as the record everything else deals in, with its moment written as the contract
 * writes them.
 *
 * @param row - The row.
 * @returns The record.
 */
const asRecord = (row: BlockedReleaseRow): BlockedReleaseRecord => ({
  ...row,
  at: row.at.toISOString(),
});

/**
 * Releases that failed a request and are not to be tried for it again, kept in the service's own
 * schema. The same release blocked twice for one request is kept once.
 *
 * @param db - The database.
 * @returns The store.
 */
const createDatabaseBlockedReleaseStore = (db: RequestsDatabase): BlockedReleaseStore => ({
  list: async () => (await db.select().from(blocklistedRelease)).map(asRecord),

  find: async (id) => {
    const [row] = await db.select().from(blocklistedRelease).where(eq(blocklistedRelease.id, id));

    return row === undefined ? null : asRecord(row);
  },

  insert: async (record) => {
    const [row] = await db
      .insert(blocklistedRelease)
      .values({ ...record, at: new Date(record.at) })
      .onConflictDoNothing()
      .returning();

    return row === undefined ? record : asRecord(row);
  },

  update: async (id, changes) => {
    const { at, ...rest } = changes;
    const [row] = await db
      .update(blocklistedRelease)
      .set({ ...rest, ...(at === undefined ? {} : { at: new Date(at) }) })
      .where(eq(blocklistedRelease.id, id))
      .returning();

    return row === undefined ? null : asRecord(row);
  },

  remove: async (id) =>
    (
      await db
        .delete(blocklistedRelease)
        .where(eq(blocklistedRelease.id, id))
        .returning({ id: blocklistedRelease.id })
    ).length > 0,
});

export { createDatabaseBlockedReleaseStore };
