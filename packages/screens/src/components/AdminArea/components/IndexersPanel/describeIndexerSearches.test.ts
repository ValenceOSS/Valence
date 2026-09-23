import { describe, expect, it } from 'vitest';
import { describeIndexerSearches } from './describeIndexerSearches';
import type { Indexer } from '@ValenceContracts/schemas/Indexer';

const AN_INDEXER: Indexer = {
  id: '0f8fad5b-d9cb-469f-a165-70867728950e',
  name: 'Jackett',
  kind: 'torznab',
  url: 'http://jackett:9117/',
  hasApiKey: true,
  definitionId: null,
  settings: {},
  secretsSet: [],
  privacy: null,
  priority: 25,
  isEnabled: true,
  categories: [],
  requestsPerMinute: null,
  timeoutSeconds: 30,
  capabilities: {
    categories: [],
    modes: [
      { mode: 'search', parameters: ['q'] },
      { mode: 'movie', parameters: ['q'] },
      { mode: 'tv', parameters: ['q'] },
    ],
    limit: null,
  },
  failures: 0,
  lastProblem: null,
  lastProblemCode: null,
  lastFailedAt: null,
  turnedOffBecause: null,
  removesWhenDone: null,
  seedSeconds: null,
  seedRatio: null,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
};

describe('describeIndexerSearches', () => {
  it('names the kinds of search an indexer takes', () => {
    expect(describeIndexerSearches(AN_INDEXER)).toBe('Words · Films · Series');
  });

  it('says to test one nobody has asked', () => {
    expect(describeIndexerSearches({ ...AN_INDEXER, capabilities: null })).toBe(
      'Test it to find out',
    );
  });

  it('says words where an indexer named no kinds at all', () => {
    expect(
      describeIndexerSearches({
        ...AN_INDEXER,
        capabilities: { categories: [], modes: [], limit: null },
      }),
    ).toBe('Words');
  });
});
