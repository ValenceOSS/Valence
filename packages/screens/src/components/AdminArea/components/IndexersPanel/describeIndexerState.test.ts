import { describe, expect, it } from 'vitest';
import { describeIndexerState } from './describeIndexerState';
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

describe('describeIndexerState', () => {
  it('says an indexer that answers is working', () => {
    expect(describeIndexerState(AN_INDEXER)).toEqual({
      label: 'Working',
      tone: 'success',
      detail: null,
    });
  });

  it('says one nobody has tried has not been', () => {
    expect(describeIndexerState({ ...AN_INDEXER, capabilities: null }).label).toBe('Not tried');
  });

  it('says how often one has failed, and why', () => {
    expect(describeIndexerState({ ...AN_INDEXER, failures: 1, lastProblem: 'Timed out' })).toEqual({
      label: 'Failed once',
      tone: 'warning',
      detail: 'Timed out',
      help: 'https://docs.getvalence.app/install/requesting#failing-indexers',
    });
    expect(
      describeIndexerState({
        ...AN_INDEXER,
        failures: 1,
        lastProblem: 'Refused',
        lastProblemCode: 'CloudflareRefusesAddress',
      }).help,
    ).toBe('https://docs.getvalence.app/install/requesting#indexers-behind-cloudflare');
    expect(describeIndexerState({ ...AN_INDEXER, failures: 3 }).label).toBe('Failed 3 times');
  });

  it('says one somebody switched off is off', () => {
    expect(describeIndexerState({ ...AN_INDEXER, isEnabled: false }).label).toBe('Off');
  });

  it('says why Valence turned one off', () => {
    expect(
      describeIndexerState({
        ...AN_INDEXER,
        isEnabled: false,
        turnedOffBecause: 'Turned off after 5 failures in a row',
        removesWhenDone: null,
        seedSeconds: null,
        seedRatio: null,
      }),
    ).toEqual({
      label: 'Turned off',
      tone: 'danger',
      detail: 'Turned off after 5 failures in a row',
      help: 'https://docs.getvalence.app/install/requesting#failing-indexers',
    });
  });
});
