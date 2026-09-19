import { describe, expect, it, vi } from 'vitest';
import { IndexerFailure } from './IndexerFailure';
import { createIndexerService } from './createIndexerService';
import { createMemoryIndexerStore } from './createMemoryIndexerStore';
import type { IndexerClient, IndexerConnection } from './createIndexerClient';
import type { IndexerRecord } from './IndexerRecord';
import type { IndexerCapabilities, Release } from '@ValenceContracts/schemas/Indexer';

const NOW = new Date('2026-09-19T12:00:00.000Z');

const CAPS: IndexerCapabilities = {
  categories: [{ id: 2000, name: 'Movies', subcategories: [] }],
  modes: [{ mode: 'search', parameters: ['q'] }],
  limit: 100,
};

/**
 * An indexer as kept, with anything the test cares about changed.
 */
const anIndexer = (overrides: Partial<IndexerRecord> = {}): IndexerRecord => ({
  id: '0f8fad5b-d9cb-469f-a165-70867728950e',
  name: 'Jackett',
  kind: 'torznab',
  url: 'http://jackett:9117/',
  apiKey: 'a-key',
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
  createdAt: '2026-09-18T00:00:00.000Z',
  updatedAt: '2026-09-18T00:00:00.000Z',
  ...overrides,
});

const SECOND = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

/**
 * A release one indexer found.
 */
const aRelease = (indexer: IndexerConnection, title: string): Release => ({
  id: `${indexer.id}-${title}`,
  title,
  indexerId: indexer.id,
  indexerName: indexer.name,
  protocol: 'torrent',
  sizeBytes: null,
  seeders: null,
  leechers: null,
  grabs: null,
  publishedAt: null,
  categories: [],
  downloadUrl: null,
  magnetUrl: null,
  infoUrl: null,
  infoHash: null,
  downloadFactor: null,
  uploadFactor: null,
  minimumRatio: null,
  minimumSeedSeconds: null,
});

/**
 * A client that answers as told, or fails with the reason given.
 */
const aClient = (
  answers: {
    capabilities?: IndexerCapabilities | Error;
    search?: (indexer: IndexerConnection) => Release[];
  } = {},
): IndexerClient => ({
  capabilities: vi.fn(() =>
    answers.capabilities instanceof Error
      ? Promise.reject(answers.capabilities)
      : Promise.resolve(answers.capabilities ?? CAPS),
  ),
  search: vi.fn((indexer: IndexerConnection) => {
    try {
      return Promise.resolve(answers.search?.(indexer) ?? []);
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error('no'));
    }
  }),
});

/**
 * The service over a store holding the indexers given.
 */
const aService = (records: IndexerRecord[] = [], client = aClient()) => {
  const store = createMemoryIndexerStore(records);

  return { service: createIndexerService({ store, client, now: () => NOW }), store, client };
};

describe('createIndexerService', () => {
  it('lists indexers by priority, then name, without their keys', async () => {
    const { service } = aService([
      anIndexer({ name: 'Zeta' }),
      anIndexer({ id: SECOND, name: 'Alpha' }),
      anIndexer({
        id: '9b2e1f5a-8d4c-4e2a-9f6b-1c3d5e7f9a0b',
        name: 'First',
        priority: 1,
        apiKey: '',
      }),
    ]);

    const listed = await service.list();

    expect(listed.map((one) => one.name)).toEqual(['First', 'Alpha', 'Zeta']);
    expect(listed.map((one) => one.hasApiKey)).toEqual([false, true, true]);
    expect(Object.keys(listed[0] ?? {})).not.toContain('apiKey');
  });

  it('adds an indexer, filling in what was not decided', async () => {
    const { service, store } = aService();

    const added = await service.add({
      name: 'NZBgeek',
      kind: 'newznab',
      url: 'https://api.nzbgeek.info',
      apiKey: 'secret',
    });

    expect(added).toMatchObject({
      name: 'NZBgeek',
      priority: 25,
      hasApiKey: true,
      createdAt: NOW.toISOString(),
    });
    expect((await store.find(added.id))?.apiKey).toBe('secret');
  });

  it('changes only what it is told, and keeps the key when none is given', async () => {
    const { service, store } = aService([anIndexer()]);

    expect(await service.change(anIndexer().id, { priority: 5 })).toMatchObject({ priority: 5 });
    expect((await store.find(anIndexer().id))?.apiKey).toBe('a-key');
  });

  it('forgets what an indexer can do when it is moved somewhere else', async () => {
    const { service } = aService([anIndexer({ capabilities: CAPS })]);

    expect(
      (await service.change(anIndexer().id, { url: 'http://prowlarr:9696/1/' }))?.capabilities,
    ).toBeNull();
    expect((await service.change(anIndexer().id, { name: 'Same place' }))?.capabilities).toBeNull();
  });

  it('keeps what an indexer can do when it stays where it is', async () => {
    const { service } = aService([anIndexer({ capabilities: CAPS })]);

    expect((await service.change(anIndexer().id, { url: anIndexer().url }))?.capabilities).toEqual(
      CAPS,
    );
  });

  it('clears why an indexer was turned off when somebody switches it back on', async () => {
    const { service } = aService([
      anIndexer({ isEnabled: false, failures: 5, turnedOffBecause: 'Turned off after 5 failures' }),
    ]);

    expect(await service.change(anIndexer().id, { isEnabled: true })).toMatchObject({
      isEnabled: true,
      failures: 0,
      turnedOffBecause: null,
    });
  });

  it('changes and tests nothing that is not there', async () => {
    const { service } = aService();

    expect(await service.change(anIndexer().id, { priority: 1 })).toBeNull();
    expect(await service.test(anIndexer().id)).toBeNull();
    expect(await service.remove(anIndexer().id)).toBe(false);
  });

  it('tests an indexer, keeping what it can do and clearing its failures', async () => {
    const { service, store } = aService([anIndexer({ failures: 2, lastProblem: 'Timed out' })]);

    expect(await service.test(anIndexer().id)).toEqual({
      isWorking: true,
      problem: null,
      capabilities: CAPS,
    });
    expect(await store.find(anIndexer().id)).toMatchObject({
      capabilities: CAPS,
      failures: 0,
      lastProblem: null,
    });
  });

  it('counts a failed test against an indexer, saying why', async () => {
    const { service, store } = aService(
      [anIndexer()],
      aClient({ capabilities: new IndexerFailure('The indexer refused the API key') }),
    );

    expect(await service.test(anIndexer().id)).toEqual({
      isWorking: false,
      problem: 'The indexer refused the API key',
      capabilities: null,
    });
    expect(await store.find(anIndexer().id)).toMatchObject({
      failures: 1,
      lastProblem: 'The indexer refused the API key',
      lastFailedAt: NOW.toISOString(),
    });
  });

  it('says something even for a failure it did not expect', async () => {
    const { service } = aService([anIndexer()], aClient({ capabilities: new Error('boom') }));

    expect((await service.test(anIndexer().id))?.problem).toBe('The indexer could not be asked');
  });

  it('tries an indexer before it is kept, keeping nothing', async () => {
    const { service, store, client } = aService();

    expect(
      await service.tryDraft({
        name: 'New',
        kind: 'torznab',
        url: 'http://jackett:9117/',
        apiKey: 'k',
      }),
    ).toMatchObject({ isWorking: true });
    expect(await store.list()).toEqual([]);
    expect(client.capabilities).toHaveBeenCalledWith(expect.objectContaining({ apiKey: 'k' }));
  });

  it('tries a change to a kept indexer with the key it already has', async () => {
    const { service, client } = aService([anIndexer()]);

    await service.tryDraft(
      { name: 'Jackett', kind: 'torznab', url: 'http://elsewhere:9117/' },
      anIndexer().id,
    );

    expect(client.capabilities).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: 'a-key', url: 'http://elsewhere:9117/' }),
    );
  });

  it('tries a draft with no key for an indexer that is not kept', async () => {
    const { service, client } = aService();

    await service.tryDraft({ name: 'New', kind: 'torznab', url: 'http://x:1/' }, SECOND);

    expect(client.capabilities).toHaveBeenCalledWith(expect.objectContaining({ apiKey: '' }));
  });

  it('searches every indexer that is on at once, and says what each found', async () => {
    const first = anIndexer({ priority: 10 });
    const second = anIndexer({ id: SECOND, name: 'NZBgeek', priority: 5 });
    const off = anIndexer({
      id: '9b2e1f5a-8d4c-4e2a-9f6b-1c3d5e7f9a0b',
      name: 'Off',
      isEnabled: false,
    });
    const { service, client } = aService(
      [first, second, off],
      aClient({ search: (indexer) => [aRelease(indexer, 'Dune')] }),
    );

    const outcome = await service.search({ query: 'dune' });

    expect(outcome.releases.map((release) => release.indexerName)).toEqual(['NZBgeek', 'Jackett']);
    expect(outcome.indexers).toEqual([
      expect.objectContaining({ indexerName: 'NZBgeek', found: 1, problem: null }),
      expect.objectContaining({ indexerName: 'Jackett', found: 1, problem: null }),
    ]);
    expect(client.search).toHaveBeenCalledTimes(2);
  });

  it('searches only the indexers asked for', async () => {
    const { service, client } = aService([anIndexer(), anIndexer({ id: SECOND, name: 'NZBgeek' })]);

    await service.search({ query: 'dune', indexerIds: [SECOND] });

    expect(client.search).toHaveBeenCalledTimes(1);
    expect(client.search).toHaveBeenCalledWith(
      expect.objectContaining({ id: SECOND }),
      expect.anything(),
    );
  });

  it('goes on without an indexer that failed, saying why, and counting it', async () => {
    const { service, store } = aService(
      [anIndexer(), anIndexer({ id: SECOND, name: 'NZBgeek' })],
      aClient({
        search: (indexer) => {
          if (indexer.id === SECOND) {
            throw new IndexerFailure('The indexer did not answer within 30 seconds');
          }

          return [aRelease(indexer, 'Dune')];
        },
      }),
    );

    const outcome = await service.search({ query: 'dune' });

    expect(outcome.releases).toHaveLength(1);
    expect(outcome.indexers.find((one) => one.indexerId === SECOND)?.problem).toBe(
      'The indexer did not answer within 30 seconds',
    );
    expect((await store.find(SECOND))?.failures).toBe(1);
  });

  it('says something for a search failure it did not expect', async () => {
    const { service } = aService(
      [anIndexer()],
      aClient({
        search: () => {
          throw new Error('boom');
        },
      }),
    );

    expect((await service.search({ query: 'x' })).indexers[0]?.problem).toBe(
      'The indexer could not be asked',
    );
  });

  it('turns an indexer off after too many failures in a row, saying why', async () => {
    const { service, store } = aService(
      [anIndexer({ failures: 4 })],
      aClient({ capabilities: new IndexerFailure('The indexer could not be reached') }),
    );

    await service.test(anIndexer().id);

    expect(await store.find(anIndexer().id)).toMatchObject({
      isEnabled: false,
      failures: 5,
      turnedOffBecause: 'Turned off after 5 failures in a row: The indexer could not be reached',
    });
  });

  it('clears the count when an indexer answers a search', async () => {
    const { service, store } = aService([anIndexer({ failures: 2 })]);

    await service.search({ query: 'x' });

    expect((await store.find(anIndexer().id))?.failures).toBe(0);
  });

  it('says how many indexers there are, and which are failing', async () => {
    const { service } = aService([
      anIndexer(),
      anIndexer({ id: SECOND, name: 'Flaky', failures: 3, lastProblem: 'Timed out' }),
      anIndexer({
        id: '9b2e1f5a-8d4c-4e2a-9f6b-1c3d5e7f9a0b',
        name: 'Off',
        isEnabled: false,
        failures: 5,
        turnedOffBecause: 'Turned off after 5 failures',
      }),
      anIndexer({ id: '1b4e28ba-2fa1-41d2-883f-0016d3cca427', name: 'Quiet', failures: 3 }),
    ]);

    expect(await service.health()).toEqual({
      total: 4,
      enabled: 3,
      failing: [
        { id: SECOND, name: 'Flaky', problem: 'Timed out' },
        {
          id: '9b2e1f5a-8d4c-4e2a-9f6b-1c3d5e7f9a0b',
          name: 'Off',
          problem: 'Turned off after 5 failures',
        },
        { id: '1b4e28ba-2fa1-41d2-883f-0016d3cca427', name: 'Quiet', problem: 'Failing' },
      ],
    });
  });
});
