import type { CatalogueEntry } from '@ValenceSDK/package/CatalogueSchema';

/**
 * A plugin as the official catalogue lists it, with anything a test cares about swapped in.
 *
 * @param overrides - The fields that differ.
 * @returns The entry.
 */
const aCatalogueEntry = (overrides: Partial<CatalogueEntry> = {}): CatalogueEntry => ({
  id: 'anilist',
  name: 'AniList and MyAnimeList',
  description: 'Imports your anime list and keeps what you have watched in step.',
  author: 'Valence',
  version: '1.0.0',
  apiVersion: '^1.0',
  kinds: ['extension'],
  permissions: [{ kind: 'network', hosts: ['graphql.anilist.co', 'anilist.co'] }],
  packageUrl:
    'https://github.com/ValenceOSS/valence-plugins/releases/download/anilist-v1.0.0/anilist-1.0.0.vplugin',
  sha256: 'a'.repeat(64),
  signature: 'c2lnbmF0dXJl',
  keyId: 'valence-official-2026',
  sourceUrl: 'https://github.com/ValenceOSS/valence-plugins/tree/main/plugins/anilist',
  publishedAt: '2026-09-28T12:00:00.000Z',
  ...overrides,
});

export { aCatalogueEntry };
