import { describe, expect, it } from 'vitest';
import { createMemoryIndexerStore } from './createMemoryIndexerStore';
import type { IndexerRecord } from './IndexerRecord';

const AN_INDEXER: IndexerRecord = {
  id: '0f8fad5b-d9cb-469f-a165-70867728950e',
  name: 'Jackett',
  kind: 'torznab',
  url: 'http://jackett:9117/',
  apiKey: 'a-key',
  definitionId: null,
  settings: {},
  session: null,
  priority: 25,
  isEnabled: true,
  categories: [],
  requestsPerMinute: null,
  timeoutSeconds: 30,
  capabilities: null,
  failures: 0,
  lastProblem: null,
  lastFailedAt: null,
  turnedOffBecause: null,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
};

describe('createMemoryIndexerStore', () => {
  it('keeps what it is given, and finds it again', async () => {
    const store = createMemoryIndexerStore();

    await store.insert(AN_INDEXER);

    expect(await store.list()).toEqual([AN_INDEXER]);
    expect(await store.find(AN_INDEXER.id)).toEqual(AN_INDEXER);
    expect(await store.find('nothing')).toBeNull();
  });

  it('changes only what it is told to', async () => {
    const store = createMemoryIndexerStore([AN_INDEXER]);

    expect(await store.update(AN_INDEXER.id, { isEnabled: false })).toEqual({
      ...AN_INDEXER,
      isEnabled: false,
    });
    expect(await store.update('nothing', { isEnabled: false })).toBeNull();
  });

  it('forgets what it is told to, and says whether there was anything', async () => {
    const store = createMemoryIndexerStore([AN_INDEXER]);

    expect(await store.remove(AN_INDEXER.id)).toBe(true);
    expect(await store.remove(AN_INDEXER.id)).toBe(false);
  });
});
