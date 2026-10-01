import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { serverSetting } from '#dialect/Schema';
import { ServerSettingsSchema } from './ServerSettings';
import { createDatabaseSettingsStore } from './createDatabaseSettingsStore';

const STARTING_POSTGRES_MS = 60_000;

const DEFAULTS = ServerSettingsSchema.parse({
  trustedOrigins: [],
  cookieSecure: false,
  setupCompletedAt: null,
});

describe('createDatabaseSettingsStore', () => {
  it(
    'answers the defaults until something is written',
    async () => {
      const store = createDatabaseSettingsStore({
        db: await aMigratedDatabase(),
        defaults: DEFAULTS,
      });

      expect(await store.read()).toStrictEqual(DEFAULTS);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'keeps one row, the first write making it and every later one changing it',
    async () => {
      const db = await aMigratedDatabase();
      const store = createDatabaseSettingsStore({ db, defaults: DEFAULTS });

      await store.write({ hardwareAccel: 'vaapi' });
      await store.write({ omdbKey: 'key' });

      expect(await store.read()).toMatchObject({ hardwareAccel: 'vaapi', omdbKey: 'key' });
      expect(await db.select().from(serverSetting)).toHaveLength(1);
    },
    STARTING_POSTGRES_MS,
  );
});
