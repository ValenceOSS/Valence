import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '@ValenceServer/db/postgres/aMigratedDatabase';
import { PluginManifestSchema } from '@ValenceSDK/manifest/PluginManifestSchema';
import { pluginHook, pluginProfile, user, viewerProfile } from '#dialect/Schema';
import { createDatabasePluginStore } from './createDatabasePluginStore';

const STARTING_POSTGRES_MS = 60_000;

const MANIFEST = PluginManifestSchema.parse({
  manifestVersion: 2,
  id: 'store-test',
  name: 'Store Test',
  version: '1.0.0',
  apiVersion: '^1.0',
  author: { name: 'Tester' },
  description: 'Is kept.',
});

const A_RECORD = {
  id: 'store-test',
  version: '1.0.0',
  trust: 'unsigned' as const,
  manifest: MANIFEST,
  packageBase64: '',
  sha256: 'b'.repeat(64),
  isEnabled: true,
  settings: {},
  installedBy: null,
};

const A_CONNECTION = {
  pluginId: 'store-test',
  profileId: 'p1',
  provider: 'anilist',
  accessToken: 'sealed',
  refreshToken: null,
  expiresAt: null,
  account: null,
};

/**
 * A database holding one account with one profile, for a plugin to be connected to.
 *
 * @returns The database.
 */
const aDatabaseWithAProfile = async () => {
  const db = await aMigratedDatabase();

  await db.insert(user).values({ id: 'ann', name: 'Ann', email: 'ann@example.com' });
  await db.insert(viewerProfile).values({ id: 'p1', userId: 'ann', name: 'Ann', colour: 'red' });

  return db;
};

describe('createDatabasePluginStore', () => {
  it(
    'saves a plugin twice as one, changing it in place',
    async () => {
      const store = createDatabasePluginStore(await aDatabaseWithAProfile());

      await store.save(A_RECORD);
      await store.save({ ...A_RECORD, version: '1.1.0' });

      expect((await store.list()).map((one) => one.version)).toStrictEqual(['1.1.0']);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'says whether a change or a removal found the plugin',
    async () => {
      const store = createDatabasePluginStore(await aDatabaseWithAProfile());

      expect(await store.change('store-test', { isEnabled: false })).toBe(false);
      expect(await store.remove('store-test')).toBe(false);

      await store.save(A_RECORD);

      expect(await store.change('store-test', { isEnabled: false })).toBe(true);
      expect((await store.read('store-test'))?.isEnabled).toBe(false);
      expect(await store.remove('store-test')).toBe(true);
      expect(await store.list()).toStrictEqual([]);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'keeps one secret per hook, the latest written',
    async () => {
      const db = await aDatabaseWithAProfile();
      const store = createDatabasePluginStore(db);

      await store.save(A_RECORD);
      await store.saveHook('store-test', 'inbound', 'first');
      await store.saveHook('store-test', 'inbound', 'second');

      expect(await db.select({ secret: pluginHook.secret }).from(pluginHook)).toStrictEqual([
        { secret: 'second' },
      ]);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'overwrites a kept value and counts its bytes once',
    async () => {
      const store = createDatabasePluginStore(await aDatabaseWithAProfile());

      await store.save(A_RECORD);
      await store.writeValue('store-test', 'count', 1, 10);
      await store.writeValue('store-test', 'count', 2, 4);

      expect(await store.readValue('store-test', 'count')).toBe(2);
      expect(await store.bytesKept('store-test')).toBe(4);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'keeps one connection per provider, and says whether forgetting it found one',
    async () => {
      const store = createDatabasePluginStore(await aDatabaseWithAProfile());

      await store.save(A_RECORD);
      await store.saveConnection(A_CONNECTION);
      await store.saveConnection({ ...A_CONNECTION, accessToken: 'resealed' });

      expect(await store.connectionsOf('store-test')).toMatchObject([{ accessToken: 'resealed' }]);
      expect(await store.forgetConnection('store-test', 'p1', 'anilist')).toBe(true);
      expect(await store.forgetConnection('store-test', 'p1', 'anilist')).toBe(false);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'remembers a profile once however often it is seen',
    async () => {
      const db = await aDatabaseWithAProfile();
      const store = createDatabasePluginStore(db);

      await store.save(A_RECORD);
      await store.rememberProfile('store-test', 'p1');
      await store.rememberProfile('store-test', 'p1');

      expect(await store.profilesOf('store-test')).toStrictEqual(['p1']);
      expect(await db.select().from(pluginProfile)).toHaveLength(1);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'keeps the version an upgrade replaces, keeping it afresh each time, and puts it back once',
    async () => {
      const store = createDatabasePluginStore(await aDatabaseWithAProfile());

      expect(await store.keepPrevious('store-test')).toBe(false);

      await store.save(A_RECORD);
      await store.writeValue('store-test', 'count', 1, 1);
      await store.keepPrevious('store-test');
      await store.writeValue('store-test', 'count', 2, 1);

      expect(await store.keepPrevious('store-test')).toBe(true);

      await store.save({ ...A_RECORD, version: '2.0.0', sha256: 'c'.repeat(64) });
      await store.writeValue('store-test', 'count', 20, 2);

      expect(await store.restorePrevious('store-test')).toBe(true);
      expect((await store.read('store-test'))?.version).toBe('1.0.0');
      expect(await store.readValue('store-test', 'count')).toBe(2);
      expect(await store.restorePrevious('store-test')).toBe(false);
    },
    STARTING_POSTGRES_MS,
  );
});
