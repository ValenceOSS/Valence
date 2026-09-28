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
});
