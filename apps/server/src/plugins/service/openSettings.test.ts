import { describe, expect, it } from 'vitest';
import { PluginManifestSchema } from '@ValenceSDK/manifest/PluginManifestSchema';
import { sealSecret } from '@ValenceServer/plugins/sealSecret';
import { openSettings } from './openSettings';

const KEY = Buffer.alloc(32, 4);

const MANIFEST = PluginManifestSchema.parse({
  manifestVersion: 2,
  id: 'settings-test',
  name: 'Settings Test',
  version: '1.0.0',
  apiVersion: '^1.0',
  author: { name: 'Tester' },
  description: 'Has settings.',
  settings: [
    { id: 'username', label: 'Username', kind: 'text' },
    { id: 'token', label: 'Token', kind: 'secret' },
  ],
});

describe('openSettings', () => {
  it('opens secrets for the plugin, and leaves out what it does not declare', () => {
    expect(
      openSettings(MANIFEST, { username: 'ada', token: sealSecret(KEY, 'shh'), old: 'x' }, KEY),
    ).toEqual({ username: 'ada', token: 'shh' });
  });

  it('leaves out a secret that no longer opens', () => {
    expect(openSettings(MANIFEST, { token: sealSecret(Buffer.alloc(32, 5), 'shh') }, KEY)).toEqual(
      {},
    );
  });
});
