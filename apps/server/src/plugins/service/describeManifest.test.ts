import { describe, expect, it } from 'vitest';
import { PluginManifestSchema } from '@ValenceSDK/manifest/PluginManifestSchema';
import { describeManifest } from './describeManifest';

describe('describeManifest', () => {
  it('says what a plugin is and adds, with no picture where it has none', () => {
    const manifest = PluginManifestSchema.parse({
      manifestVersion: 2,
      id: 'describe-test',
      name: 'Describe Test',
      version: '1.0.0',
      apiVersion: '^1.0',
      author: { name: 'Tester' },
      description: 'Is described.',
      entry: 'dist/plugin.js',
      contributes: { pages: [{ id: 'home', title: 'Home', placement: 'account' }] },
    });

    expect(describeManifest(manifest)).toMatchObject({
      id: 'describe-test',
      author: 'Tester',
      homepage: null,
      iconUrl: null,
      pages: [{ id: 'home', title: 'Home', placement: 'account' }],
      events: [],
    });
  });
});
