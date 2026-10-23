import { describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import { serverSetting } from '#dialect/Schema';
import { ServerSettingsSchema, SETTINGS_KEY } from './ServerSettings';
import { createDatabaseSettingsStore } from './createDatabaseSettingsStore';

const STARTING_POSTGRES_MS = 60_000;

const DEFAULTS = ServerSettingsSchema.parse({
  trustedOrigins: [],
  cookieSecure: false,
  setupCompletedAt: null,
});

type Database = Awaited<ReturnType<typeof aMigratedDatabase>>;

const RawSchema = z.record(z.string(), JsonValueSchema);

/**
 * What the settings row holds, as stored.
 */
const rawOf = async (db: Database) => {
  const [row] = await db.select().from(serverSetting).where(eq(serverSetting.key, SETTINGS_KEY));

  return RawSchema.parse(row?.value ?? {});
};

/**
 * Changes fields of the settings row behind the store's back, as a different release would.
 */
const storeRaw = async (db: Database, fields: Record<string, JsonValue>) => {
  await db
    .update(serverSetting)
    .set({ value: { ...(await rawOf(db)), ...fields } })
    .where(eq(serverSetting.key, SETTINGS_KEY));
};

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

  it(
    'falls back one unreadable field at a time, saying which, and only once',
    async () => {
      const db = await aMigratedDatabase();
      const onFellBack = vi.fn();
      const store = createDatabaseSettingsStore({ db, defaults: DEFAULTS, onFellBack });

      await store.write({ omdbKey: 'kept', catalogueApiKey: 'also kept' });
      await storeRaw(db, { hardwareAccel: 42 });

      expect(await store.read()).toMatchObject({
        omdbKey: 'kept',
        catalogueApiKey: 'also kept',
        hardwareAccel: DEFAULTS.hardwareAccel,
      });

      await store.read();

      expect(onFellBack).toHaveBeenCalledOnce();
      expect(onFellBack).toHaveBeenCalledWith(['hardwareAccel']);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'keeps what was stored for an unreadable field, and a field it does not know, when saving',
    async () => {
      const db = await aMigratedDatabase();
      const store = createDatabaseSettingsStore({ db, defaults: DEFAULTS });

      await store.write({ omdbKey: 'kept' });
      await storeRaw(db, { hardwareAccel: 42, fromANewerRelease: 'yes' });
      await store.write({ catalogueApiKey: 'new' });

      expect(await rawOf(db)).toMatchObject({
        omdbKey: 'kept',
        catalogueApiKey: 'new',
        hardwareAccel: 42,
        fromANewerRelease: 'yes',
      });
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'replaces an unreadable field once a save sets it',
    async () => {
      const db = await aMigratedDatabase();
      const store = createDatabaseSettingsStore({ db, defaults: DEFAULTS });

      await store.write({});
      await storeRaw(db, { hardwareAccel: 42 });
      await store.write({ hardwareAccel: 'vaapi' });

      expect(await rawOf(db)).toMatchObject({ hardwareAccel: 'vaapi' });
      expect(await store.read()).toMatchObject({ hardwareAccel: 'vaapi' });
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'lands both of two saves made at once',
    async () => {
      const db = await aMigratedDatabase();
      const store = createDatabaseSettingsStore({ db, defaults: DEFAULTS });

      await Promise.all([store.write({ omdbKey: 'one' }), store.write({ hardwareAccel: 'vaapi' })]);

      expect(await store.read()).toMatchObject({ omdbKey: 'one', hardwareAccel: 'vaapi' });
    },
    STARTING_POSTGRES_MS,
  );
});
