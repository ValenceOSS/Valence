import { describe, expect, it } from 'vitest';
import { PluginManifestSchema } from '@ValenceSDK/manifest/PluginManifestSchema';
import { EXAMPLE_FILES_MANIFEST } from '@ValenceSDK/testing/EXAMPLE_FILES_MANIFEST';
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
      downloadClients: [],
      sources: [],
    });
  });

  it('says which download clients and sources a plugin offers', () => {
    const described = describeManifest(PluginManifestSchema.parse(EXAMPLE_FILES_MANIFEST));

    expect(described.downloadClients).toEqual([
      { id: 'files', title: 'Example files', protocol: 'torrent' },
    ]);
    expect(described.sources).toEqual([{ id: 'files', title: 'Example files' }]);
  });
});
