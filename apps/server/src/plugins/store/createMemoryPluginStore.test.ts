import { describe, expect, it } from 'vitest';
import { PluginManifestSchema } from '@ValenceSDK/manifest/PluginManifestSchema';
import { createMemoryPluginStore } from './createMemoryPluginStore';

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

describe('createMemoryPluginStore', () => {
  it('keeps app passwords by login and by hash, one login and one secret each, and forgets them with the plugin', async () => {
    const store = createMemoryPluginStore();
    const credential = {
      id: 'c1',
      pluginId: 'music',
      profileId: 'p1',
      login: 'ann',
      label: 'Phone',
      secretHash: 'a'.repeat(64),
      sealedSecret: 'v1.sealed',
      createdAt: '2026-10-31T10:00:00.000Z',
      lastUsedAt: null,
    };

    await store.saveCredential(credential);

    expect(await store.credentialByLogin('music', 'ann')).toEqual(credential);
    expect(await store.credentialBySecret('music', 'a'.repeat(64))).toEqual(credential);
    await expect(store.saveCredential({ ...credential, id: 'c2' })).rejects.toThrow();

    await store.touchCredential('c1', '2026-10-31T11:00:00.000Z');
    expect(await store.credentialsOf('music', 'p1')).toEqual([
      { ...credential, lastUsedAt: '2026-10-31T11:00:00.000Z' },
    ]);
    expect(await store.forgetCredential('music', 'p2', 'c1')).toBe(false);

    await store.remove('music');
    expect(await store.credentialByLogin('music', 'ann')).toBeNull();
  });

  it('keeps the home rows a profile chose, once each, until it stops choosing them or the plugin goes', async () => {
    const store = createMemoryPluginStore();

    await store.save(A_RECORD);
    await store.chooseHomeRow(A_RECORD.id, 'p1', 'hot', true);
    await store.chooseHomeRow(A_RECORD.id, 'p1', 'hot', true);
    await store.chooseHomeRow(A_RECORD.id, 'p2', 'hot', true);

    expect(await store.homeRowsOf('p1')).toEqual([{ pluginId: A_RECORD.id, rowId: 'hot' }]);

    await store.chooseHomeRow(A_RECORD.id, 'p1', 'hot', false);

    expect(await store.homeRowsOf('p1')).toEqual([]);

    await store.remove(A_RECORD.id);

    expect(await store.homeRowsOf('p2')).toEqual([]);
  });

  it('keeps, changes and forgets an installed plugin with everything it kept', async () => {
    const store = createMemoryPluginStore(() => new Date('2026-01-01T00:00:00.000Z'));

    await store.save(A_RECORD);
    await store.writeValue('store-test', 'list:a', 1, 10);
    await store.writeValue('store-test', 'list:b', 2, 20);
    await store.writeValue('store-test', 'other', 3, 5);
    await store.saveConnection({
      pluginId: 'store-test',
      profileId: 'p1',
      provider: 'anilist',
      accessToken: 'sealed',
      refreshToken: null,
      expiresAt: null,
      account: null,
    });
    await store.rememberProfile('store-test', 'p1');

    expect(await store.read('store-test')).toMatchObject({ isEnabled: true, problem: null });
    expect(await store.listKeys('store-test', 'list:')).toEqual(['list:a', 'list:b']);
    expect(await store.bytesKept('store-test')).toBe(35);
    expect(await store.bytesKept('store-test', 'other')).toBe(30);
    expect(await store.readValue('store-test', 'list:b')).toBe(2);
    expect(await store.profilesOf('store-test')).toEqual(['p1']);
    expect(await store.change('store-test', { isEnabled: false })).toBe(true);
    expect((await store.read('store-test'))?.isEnabled).toBe(false);

    await store.forgetValue('store-test', 'other');

    expect(await store.readValue('store-test', 'other')).toBeNull();
    expect(await store.remove('store-test')).toBe(true);
    expect(await store.list()).toEqual([]);
    expect(await store.readValue('store-test', 'list:a')).toBeNull();
    expect(await store.readConnection('store-test', 'p1', 'anilist')).toBeNull();
    expect(await store.remove('store-test')).toBe(false);
  });

  it('forgets the version an upgrade replaced, leaving nothing to put back', async () => {
    const store = createMemoryPluginStore();

    await store.save(A_RECORD);
    await store.keepPrevious('store-test');
    await store.forgetPrevious('store-test');

    expect((await store.read('store-test'))?.previousVersion).toBeNull();
    expect(await store.restorePrevious('store-test')).toBe(false);
  });

  it('keeps the version an upgrade replaces with what it kept, and puts both back once', async () => {
    const store = createMemoryPluginStore(() => new Date('2026-01-01T00:00:00.000Z'));

    await store.save({ ...A_RECORD, settings: { user: 'me' } });
    await store.writeValue('store-test', 'count', 2, 1);

    expect(await store.keepPrevious('store-test')).toBe(true);

    await store.save({ ...A_RECORD, version: '2.0.0', sha256: 'c'.repeat(64), settings: {} });
    await store.writeValue('store-test', 'count', 20, 2);

    expect((await store.read('store-test'))?.previousVersion).toBe('1.0.0');
    expect(await store.restorePrevious('store-test')).toBe(true);

    const back = await store.read('store-test');

    expect(back?.version).toBe('1.0.0');
    expect(back?.sha256).toBe('b'.repeat(64));
    expect(back?.previousVersion).toBeNull();
    expect(back?.settings).toEqual({ user: 'me' });
    expect(await store.readValue('store-test', 'count')).toBe(2);
    expect(await store.restorePrevious('store-test')).toBe(false);
    expect(await store.keepPrevious('nothing-here')).toBe(false);
  });
});
