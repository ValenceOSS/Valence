import { describe, expect, it } from 'vitest';
import { PluginManifestSchema } from '@ValenceSDK/manifest/PluginManifestSchema';
import { openSecret } from '@ValenceServer/plugins/openSecret';
import { changeSettings } from './changeSettings';

const KEY = Buffer.alloc(32, 9);

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
    { id: 'isLoud', label: 'Loud', kind: 'toggle' },
  ],
});

describe('changeSettings', () => {
  it('keeps what was given, sealing secrets', () => {
    const changed = changeSettings(
      MANIFEST,
      {},
      { username: 'ada', token: 'shh', isLoud: true },
      KEY,
    );

    if ('problem' in changed) {
      throw new Error(changed.problem.message);
    }

    expect(changed.settings['username']).toBe('ada');
    expect(changed.settings['isLoud']).toBe(true);
    expect(changed.settings['token']).not.toBe('shh');
    expect(openSecret(KEY, String(changed.settings['token']))).toBe('shh');
  });

  it('clears a setting given as nothing, and drops one no longer declared', () => {
    expect(
      changeSettings(MANIFEST, { username: 'ada', gone: 'x' }, { username: null }, KEY),
    ).toEqual({ settings: {} });
  });

  it.each([
    [{ nothing: 'x' }, 'no setting called nothing'],
    [{ isLoud: 'yes' }, 'Loud has the wrong type of value'],
    [{ username: true }, 'Username has the wrong type of value'],
    [{ username: 'x'.repeat(4001) }, 'Username is too long'],
  ])('refuses %o', (changes, problem) => {
    const answer = changeSettings(MANIFEST, {}, changes, KEY);

    expect('problem' in answer ? answer.problem.message : '').toContain(problem);
  });
});
