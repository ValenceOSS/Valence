import { eq } from 'drizzle-orm';
import { qualityProfile } from '@ValenceRequests/db/Schema';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';
import type { RequestsDatabase } from '@ValenceRequests/db/Database';
import type { RecordStore } from '@ValenceRequests/stores/RecordStore';

type ProfileRow = typeof qualityProfile.$inferSelect;

/**
 * Reads a row as the profile everything else deals in, with its moments written as the contract
 * writes them.
 *
 * @param row - The row.
 * @returns The profile.
 */
const asProfile = (row: ProfileRow): QualityProfile => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

/**
 * Quality profiles kept in the service's own schema.
 *
 * @param db - The database.
 * @returns The store.
 */
const createDatabaseProfileStore = (db: RequestsDatabase): RecordStore<QualityProfile> => ({
  list: async () => (await db.select().from(qualityProfile)).map(asProfile),

  find: async (id) => {
    const [row] = await db.select().from(qualityProfile).where(eq(qualityProfile.id, id));

    return row === undefined ? null : asProfile(row);
  },

  insert: async (profile) => {
    const [row] = await db
      .insert(qualityProfile)
      .values({
        ...profile,
        createdAt: new Date(profile.createdAt),
        updatedAt: new Date(profile.updatedAt),
      })
      .returning();

    return row === undefined ? profile : asProfile(row);
  },

  update: async (id, changes) => {
    const { createdAt, updatedAt, ...rest } = changes;
    const [row] = await db
      .update(qualityProfile)
      .set({
        ...rest,
        ...(createdAt === undefined ? {} : { createdAt: new Date(createdAt) }),
        ...(updatedAt === undefined ? {} : { updatedAt: new Date(updatedAt) }),
      })
      .where(eq(qualityProfile.id, id))
      .returning();

    return row === undefined ? null : asProfile(row);
  },

  remove: async (id) =>
    (
      await db
        .delete(qualityProfile)
        .where(eq(qualityProfile.id, id))
        .returning({ id: qualityProfile.id })
    ).length > 0,
});

export { createDatabaseProfileStore };
