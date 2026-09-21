import { describe, expect, it } from 'vitest';
import { aScratchDatabase } from '@ValenceRequests/testing/aScratchDatabase';
import { createDatabaseIndexerStore } from './createDatabaseIndexerStore';
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
  priority: 10,
  isEnabled: true,
  categories: [2000, 5000],
  requestsPerMinute: 30,
  timeoutSeconds: 20,
  removesWhenDone: null,
  seedSeconds: null,
  seedRatio: null,
  capabilities: { categories: [], modes: [{ mode: 'search', parameters: ['q'] }], limit: 100 },
  failures: 0,
  lastProblem: null,
  lastFailedAt: null,
  turnedOffBecause: null,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
};

describe('createDatabaseIndexerStore', () => {
  it('keeps an indexer, and reads it back as it was given', async () => {
    const store = createDatabaseIndexerStore(await aScratchDatabase());

    expect(await store.insert(AN_INDEXER)).toEqual(AN_INDEXER);
    expect(await store.list()).toEqual([AN_INDEXER]);
    expect(await store.find(AN_INDEXER.id)).toEqual(AN_INDEXER);
  });

  it('finds nothing that was never kept', async () => {
    const store = createDatabaseIndexerStore(await aScratchDatabase());

    expect(await store.find(AN_INDEXER.id)).toBeNull();
    expect(await store.update(AN_INDEXER.id, { isEnabled: false })).toBeNull();
    expect(await store.remove(AN_INDEXER.id)).toBe(false);
  });

  it('records a failure, and clears it again', async () => {
    const store = createDatabaseIndexerStore(await aScratchDatabase());

    await store.insert(AN_INDEXER);

    const failed = await store.update(AN_INDEXER.id, {
      failures: 1,
      lastProblem: 'Timed out',
      lastFailedAt: '2026-09-19T01:00:00.000Z',
      updatedAt: '2026-09-19T01:00:00.000Z',
    });

    expect(failed).toMatchObject({
      failures: 1,
      lastFailedAt: '2026-09-19T01:00:00.000Z',
      updatedAt: '2026-09-19T01:00:00.000Z',
    });

    expect(await store.update(AN_INDEXER.id, { failures: 0, lastFailedAt: null })).toMatchObject({
      failures: 0,
      lastFailedAt: null,
      createdAt: AN_INDEXER.createdAt,
    });
  });

  it('can move when an indexer was made', async () => {
    const store = createDatabaseIndexerStore(await aScratchDatabase());

    await store.insert({ ...AN_INDEXER, lastFailedAt: '2026-09-19T01:00:00.000Z' });

    expect(
      (await store.update(AN_INDEXER.id, { createdAt: '2026-01-01T00:00:00.000Z' }))?.createdAt,
    ).toBe('2026-01-01T00:00:00.000Z');
  });

  it('forgets an indexer', async () => {
    const store = createDatabaseIndexerStore(await aScratchDatabase());

    await store.insert(AN_INDEXER);

    expect(await store.remove(AN_INDEXER.id)).toBe(true);
    expect(await store.list()).toEqual([]);
  });
});
