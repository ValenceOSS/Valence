import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { indexerDefinition, setting } from '@ValenceRequests/db/Schema';
import type { RequestsDatabase } from '@ValenceRequests/db/Database';
import type { DefinitionStore } from '@ValenceRequests/definitions/DefinitionRecord';

const STATE_KEY = 'definitions';

const StateSchema = z.object({
  updatedAt: z.string().nullable().default(null),
  problem: z.string().nullable().default(null),
});

/**
 * Definitions kept in the service's own schema, with how the catalogue last fared kept beside them.
 *
 * @param db - The database.
 * @returns The store.
 */
const createDatabaseDefinitionStore = (db: RequestsDatabase): DefinitionStore => ({
  list: async () =>
    (
      await db
        .select({
          id: indexerDefinition.id,
          name: indexerDefinition.name,
          description: indexerDefinition.description,
          language: indexerDefinition.language,
          privacy: indexerDefinition.privacy,
          categories: indexerDefinition.categories,
          sha: indexerDefinition.sha,
        })
        .from(indexerDefinition)
    ).map((row) => ({ ...row, protocol: 'torrent' as const })),

  get: async (id) => {
    const [row] = await db.select().from(indexerDefinition).where(eq(indexerDefinition.id, id));

    return row === undefined
      ? null
      : { ...row, protocol: 'torrent' as const, fetchedAt: row.fetchedAt.toISOString() };
  },

  save: async (records) => {
    for (const {
      id,
      name,
      description,
      language,
      privacy,
      categories,
      yaml,
      sha,
      fetchedAt,
    } of records) {
      const values = {
        id,
        name,
        description,
        language,
        privacy,
        categories,
        yaml,
        sha,
        fetchedAt: new Date(fetchedAt),
      };

      await db
        .insert(indexerDefinition)
        .values(values)
        .onConflictDoUpdate({ target: indexerDefinition.id, set: values });
    }
  },

  remove: async (ids) => {
    if (ids.length > 0) {
      await db.delete(indexerDefinition).where(inArray(indexerDefinition.id, [...ids]));
    }
  },

  readState: async () => {
    const [row] = await db.select().from(setting).where(eq(setting.key, STATE_KEY));

    return StateSchema.parse(row?.value ?? {});
  },

  writeState: async (state) => {
    await db
      .insert(setting)
      .values({ key: STATE_KEY, value: state })
      .onConflictDoUpdate({ target: setting.key, set: { value: state, updatedAt: new Date() } });
  },
});

export { createDatabaseDefinitionStore };
