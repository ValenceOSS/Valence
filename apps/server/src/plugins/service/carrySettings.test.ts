import { describe, expect, it } from 'vitest';
import { PluginManifestSchema } from '@ValenceSDK/manifest/PluginManifestSchema';
import { carrySettings } from './carrySettings';

const manifestWith = (settings: { id: string; kind: 'text' | 'secret' | 'toggle' }[]) =>
  PluginManifestSchema.parse({
    manifestVersion: 2,
    id: 'carry-test',
    name: 'Carry Test',
    version: '1.0.0',
    apiVersion: '^1.0',
    author: { name: 'Tester' },
    description: 'Keeps settings.',
    settings: settings.map((setting) => ({ ...setting, label: setting.id })),
  });

describe('carrySettings', () => {
  it('keeps a setting the new version declares as the same kind', () => {
    const before = manifestWith([
      { id: 'user', kind: 'text' },
      { id: 'token', kind: 'secret' },
      { id: 'sync', kind: 'toggle' },
    ]);

    expect(carrySettings(before, before, { user: 'me', token: 'v1.sealed', sync: true })).toEqual({
      user: 'me',
      token: 'v1.sealed',
      sync: true,
    });
  });

  it('starts a setting empty where its kind changed, and drops one no longer declared', () => {
    const before = manifestWith([
      { id: 'user', kind: 'text' },
      { id: 'token', kind: 'secret' },
      { id: 'sync', kind: 'toggle' },
      { id: 'gone', kind: 'text' },
    ]);
    const after = manifestWith([
      { id: 'user', kind: 'secret' },
      { id: 'token', kind: 'text' },
      { id: 'sync', kind: 'text' },
      { id: 'added', kind: 'text' },
    ]);

    expect(
      carrySettings(before, after, { user: 'me', token: 'v1.sealed', sync: true, gone: 'x' }),
    ).toEqual({});
  });
});
