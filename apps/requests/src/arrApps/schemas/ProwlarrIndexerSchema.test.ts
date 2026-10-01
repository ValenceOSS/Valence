import { describe, expect, it } from 'vitest';
import { ProwlarrIndexerSchema } from './ProwlarrIndexerSchema';

describe('ProwlarrIndexerSchema', () => {
  it('reads an indexer of Prowlarr’s, with its categories', () => {
    expect(
      ProwlarrIndexerSchema.parse({
        indexerUrls: ['https://nyaa.si/'],
        legacyUrls: [],
        definitionName: 'nyaasi',
        description: 'Nyaa is a Public torrent site focused on Eastern Asian media',
        language: 'en-US',
        enable: true,
        redirect: false,
        supportsRss: true,
        supportsSearch: true,
        supportsRedirect: false,
        supportsPagination: false,
        appProfileId: 1,
        protocol: 'torrent',
        privacy: 'public',
        capabilities: {
          limitsMax: 100,
          limitsDefault: 100,
          categories: [
            {
              id: 5000,
              name: 'TV',
              subCategories: [{ id: 5070, name: 'TV/Anime', subCategories: [] }],
            },
            { id: 100_001, name: 'Anime - English-translated', subCategories: [] },
          ],
          supportsRawSearch: false,
          searchParams: ['q'],
          tvSearchParams: ['q', 'season', 'ep'],
        },
        priority: 25,
        downloadClientId: 0,
        added: '2026-09-30T00:00:00Z',
        sortName: 'nyaa si',
        name: 'Nyaa.si',
        fields: [],
        implementationName: 'Cardigann',
        implementation: 'Cardigann',
        configContract: 'CardigannSettings',
        tags: [],
        id: 1,
      }),
    ).toEqual({
      id: 1,
      name: 'Nyaa.si',
      enable: true,
      protocol: 'torrent',
      priority: 25,
      capabilities: {
        categories: [
          { id: 5000, subCategories: [{ id: 5070 }] },
          { id: 100_001, subCategories: [] },
        ],
      },
    });
  });
});
