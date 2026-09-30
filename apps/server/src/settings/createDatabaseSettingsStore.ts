import { eq } from 'drizzle-orm';
import { upsert } from '@ValenceDatabase/upsert';
import { serverSetting } from '#dialect/Schema';
import { ServerSettingsSchema, SETTINGS_KEY } from './ServerSettings';
import type { ServerSettings, SettingsStore } from './ServerSettings';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';

type CreateDatabaseSettingsStoreOptions = {
  db: AnyValenceDatabase;
  defaults: ServerSettings;
};

/**
 * The server's own settings, held in one row of the database — everything an operator configures that is
 * not an environment variable, from the catalogue key to what this instance calls itself.
 *
 * @param db - The database to read and write.
 * @returns The settings store.
 */
const createDatabaseSettingsStore = ({
  db,
  defaults,
}: CreateDatabaseSettingsStoreOptions): SettingsStore => {
  const read = async (): Promise<ServerSettings> => {
    const rows = await db
      .select()
      .from(serverSetting)
      .where(eq(serverSetting.key, SETTINGS_KEY))
      .limit(1);

    const row = rows[0];

    if (row === undefined) {
      return defaults;
    }

    const parsed = ServerSettingsSchema.safeParse(row.value);

    return parsed.success ? parsed.data : defaults;
  };

  const write = async (patch: Partial<ServerSettings>): Promise<ServerSettings> => {
    const next = ServerSettingsSchema.parse({ ...(await read()), ...patch });

    await upsert(db, serverSetting, {
      values: [{ key: SETTINGS_KEY, value: next, updatedAt: new Date() }],
      target: serverSetting.key,
      set: { value: next, updatedAt: new Date() },
    });

    return next;
  };

  return { read, write };
};

export { createDatabaseSettingsStore };
