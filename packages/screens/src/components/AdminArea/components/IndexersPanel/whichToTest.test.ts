import { describe, expect, it } from 'vitest';
import { whichToTest } from './whichToTest';
import type { Indexer } from '@ValenceContracts/schemas/Indexer';

/**
 * An indexer, with anything the test cares about changed.
 */
const anIndexer = (overrides: Partial<Indexer>): Indexer => ({
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
  capabilities: null,
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
  ...overrides,
});

describe('whichToTest', () => {
  it('tests those that are on and those Valence turned off, not those somebody switched off', () => {
    const on = anIndexer({ id: 'on' });
    const turnedOff = anIndexer({
      id: 'turned-off',
      isEnabled: false,
      turnedOffBecause: 'Turned off after 5 failures in a row: Timed out',
    });
    const switchedOff = anIndexer({ id: 'switched-off', isEnabled: false });

    expect(whichToTest([on, turnedOff, switchedOff])).toEqual([on, turnedOff]);
  });
});
