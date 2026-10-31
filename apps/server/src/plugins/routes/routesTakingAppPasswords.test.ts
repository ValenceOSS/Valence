import { describe, expect, it } from 'vitest';
import { PluginManifestSchema } from '@ValenceSDK/manifest/PluginManifestSchema';
import type { InstalledRecord } from '@ValenceServer/plugins/store/PluginStore';
import { routesTakingAppPasswords } from './routesTakingAppPasswords';

const recordWith = (permissions: object[], routes: object[]): InstalledRecord => ({
  id: 'music',
  version: '1.0.0',
  trust: 'unsigned',
  manifest: PluginManifestSchema.parse({
    manifestVersion: 2,
    id: 'music',
    name: 'Music',
    version: '1.0.0',
    apiVersion: '^1.4',
    author: { name: 'Tester' },
    description: 'Answers apps.',
    entry: 'dist/plugin.js',
    permissions,
    contributes: { routes },
  }),
  packageBase64: '',
  sha256: 'x',
  isEnabled: true,
  settings: {},
  installedBy: null,
  installedAt: '2026-10-31T00:00:00.000Z',
  updatedAt: '2026-10-31T00:00:00.000Z',
  problem: null,
  previousVersion: null,
});

describe('routesTakingAppPasswords', () => {
  it('names the routes that take an app password, leaving out ones only public', () => {
    const record = recordWith(
      [{ kind: 'routes', public: true }],
      [
        { id: 'rest', title: 'Music apps', methods: ['GET'], signIn: [{ kind: 'bearer' }] },
        { id: 'feed', title: 'Feed', methods: ['GET'], signIn: [{ kind: 'public' }] },
      ],
    );

    expect(routesTakingAppPasswords(record).map((route) => route.id)).toEqual(['rest']);
  });
});
