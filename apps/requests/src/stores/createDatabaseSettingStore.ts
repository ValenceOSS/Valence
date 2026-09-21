import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { setting } from '@ValenceRequests/db/Schema';
import type { RequestsDatabase } from '@ValenceRequests/db/Database';

type SettingStore = {
  read: (key: string) => Promise<string | null>;
  write: (key: string, value: string) => Promise<void>;
};

const KeptSchema = z.string();

/**
 * The service's own odds and ends, one string against one key.
 *
 * Strings rather than anything shaped, because what is kept here is the fact that something has
 * happened — when the profiles were seeded, and the like. Anything with a shape to it belongs in a
 * table that says what that shape is.
 *
 * @param db - The database.
 * @returns The store.
 */
const createDatabaseSettingStore = (db: RequestsDatabase): SettingStore => ({
  read: async (key) => {
    const [row] = await db.select().from(setting).where(eq(setting.key, key));
    const kept = KeptSchema.safeParse(row?.value);

    return kept.success ? kept.data : null;
  },

  write: async (key, value) => {
    await db
      .insert(setting)
      .values({ key, value })
      .onConflictDoUpdate({ target: setting.key, set: { value, updatedAt: new Date() } });
  },
});

export type { SettingStore };

export { createDatabaseSettingStore };
