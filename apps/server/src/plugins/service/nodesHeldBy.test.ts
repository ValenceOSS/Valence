import { describe, expect, it } from 'vitest';
import { PluginManifestSchema } from '@ValenceSDK/manifest/PluginManifestSchema';
import { nodesHeldBy } from './nodesHeldBy';
import type { GrantedPermission } from '@ValenceContracts/schemas/Permission';

const MANIFEST = PluginManifestSchema.parse({
  manifestVersion: 2,
  id: 'anilist',
  name: 'AniList',
  version: '1.0.0',
  apiVersion: '^1.0',
  author: { name: 'Tester' },
  description: 'Tracks anime.',
  contributes: {
    nodes: [
      { id: 'sync', title: 'Sync lists' },
      { id: 'import', title: 'Import history' },
    ],
  },
});

describe('nodesHeldBy', () => {
  it('holds the nodes a role gave, and every node for an administrator', () => {
    const some = new Set<GrantedPermission>(['plugin.anilist.sync', 'plugin.other.import']);

    expect(nodesHeldBy(MANIFEST, some)).toEqual(['sync']);
    expect(nodesHeldBy(MANIFEST, new Set<GrantedPermission>(['administrator']))).toEqual([
      'sync',
      'import',
    ]);
    expect(nodesHeldBy(MANIFEST, new Set<GrantedPermission>(['library.create']))).toEqual([]);
  });
});
