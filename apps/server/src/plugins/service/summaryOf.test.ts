import { describe, expect, it } from 'vitest';
import { PluginManifestSchema } from '@ValenceSDK/manifest/PluginManifestSchema';
import { summaryOf } from './summaryOf';

const MANIFEST = PluginManifestSchema.parse({
  manifestVersion: 2,
  id: 'summary-test',
  name: 'Summary Test',
  version: '1.2.0',
  apiVersion: '^1.0',
  author: { name: 'Tester' },
  description: 'Is summarised.',
  icon: 'icon.png',
  settings: [
    { id: 'username', label: 'Username', kind: 'text' },
    { id: 'token', label: 'Token', kind: 'secret' },
  ],
});

const RECORD = {
  id: 'summary-test',
  version: '1.2.0',
  trust: 'official' as const,
  manifest: MANIFEST,
  packageBase64: '',
  sha256: 'a'.repeat(64),
  isEnabled: false,
  settings: { username: 'ada', token: 'sealed' },
  installedBy: null,
  installedAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  problem: null,
  previousVersion: null,
};

describe('summaryOf', () => {
  it('shows a setting but never a secret, and a plugin turned off as stopped', () => {
    const summary = summaryOf(RECORD, 'running', '1.3.0');

    expect(summary).toMatchObject({
      id: 'summary-test',
      iconUrl: '/api/plugins/summary-test/assets/icon.png',
      state: 'stopped',
      updateAvailable: '1.3.0',
    });
    expect(summary.settings).toEqual([
      { id: 'username', label: 'Username', kind: 'text', help: null, value: 'ada', isSet: true },
      { id: 'token', label: 'Token', kind: 'secret', help: null, value: null, isSet: true },
    ]);
  });
});
