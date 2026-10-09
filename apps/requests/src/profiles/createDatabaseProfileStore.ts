import { countAffected } from '@ValenceDatabase/countAffected';
import { eq } from 'drizzle-orm';
import { qualityProfile } from '#dialect/Schema';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';
import { legacyQualitiesOf } from '@ValenceRequests/profiles/legacyQualitiesOf';
import type { RequestsDatabase } from '#dialect/RequestsDatabase';
import type { RecordStore } from '@ValenceRequests/stores/RecordStore';

type ProfileRow = typeof qualityProfile.$inferSelect;

/**
 * Reads a row as the profile everything else deals in, with its moments written as the contract
 * writes them. A profile kept before qualities were combined, which has none, takes the ones its
 * resolutions and sources make.
 *
 * @param row - The row.
 * @returns The profile.
 */
const asProfile = (row: ProfileRow): QualityProfile => {
  const {
    resolutions,
    sources,
    upgradeUntilResolution,
    upgradeUntilSource,
    qualities,
    cutoff,
    ...rest
  } = row;
  const legacy =
    qualities === null
      ? legacyQualitiesOf({ resolutions, sources, upgradeUntilResolution, upgradeUntilSource })
      : { qualities, cutoff };

  return {
    ...rest,
    ...legacy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
};

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
    await db.insert(qualityProfile).values({
      ...profile,
      createdAt: new Date(profile.createdAt),
      updatedAt: new Date(profile.updatedAt),
    });
    const [row] = await db.select().from(qualityProfile).where(eq(qualityProfile.id, profile.id));

    return row === undefined ? profile : asProfile(row);
  },

  update: async (id, changes) => {
    const { createdAt, updatedAt, ...rest } = changes;
    await db
      .update(qualityProfile)
      .set({
        ...rest,
        ...(createdAt === undefined ? {} : { createdAt: new Date(createdAt) }),
        ...(updatedAt === undefined ? {} : { updatedAt: new Date(updatedAt) }),
      })
      .where(eq(qualityProfile.id, id));
    const [row] = await db.select().from(qualityProfile).where(eq(qualityProfile.id, id));

    return row === undefined ? null : asProfile(row);
  },

  remove: async (id) =>
    countAffected(await db.delete(qualityProfile).where(eq(qualityProfile.id, id))) > 0,
});

export { createDatabaseProfileStore };
