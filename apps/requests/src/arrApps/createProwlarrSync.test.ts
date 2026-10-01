import { describe, expect, it } from 'vitest';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import { createArrCaller } from '@ValenceRequests/arrApps/createArrCaller';
import { anArrApp } from '@ValenceRequests/arrApps/testing/anArrApp';
import { aFakeArr } from '@ValenceRequests/arrApps/testing/aFakeArr';
import type { IndexerRecord } from '@ValenceRequests/indexers/IndexerRecord';
import { createMemoryRecordStore } from '@ValenceRequests/stores/createMemoryRecordStore';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { createProwlarrSync } from './createProwlarrSync';

const PROWLARR = anArrApp({
  id: '5a1d2c3b-4e5f-4a6b-8c7d-9e0f1a2b3c4d',
  kind: 'prowlarr',
  name: 'Prowlarr',
  url: 'http://prowlarr:9696/',
  apiKey: 'prowlarr-key',
});

/**
 * An indexer as Prowlarr lists it.
 *
 * @param fields - What to change.
 * @returns The indexer.
 */
const listed = (fields: Record<string, JsonValue>): JsonValue => ({
  name: 'Nyaa.si',
  enable: true,
  protocol: 'torrent',
  priority: 25,
  capabilities: {
    categories: [
      { id: 5000, name: 'TV', subCategories: [{ id: 5070, name: 'TV/Anime' }] },
      { id: 2000, name: 'Movies', subCategories: [] },
      { id: 100_001, name: 'Anime', subCategories: [] },
    ],
  },
  id: 1,
  ...fields,
});

/**
 * An indexer as Valence keeps it, made by hand unless the test says otherwise.
 *
 * @param overrides - What to change.
 * @returns The indexer.
 */
const kept = (overrides: Partial<IndexerRecord>): IndexerRecord => ({
  id: crypto.randomUUID(),
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
  removesWhenDone: null,
  seedSeconds: null,
  seedRatio: null,
  capabilities: null,
  failures: 0,
  lastProblem: null,
  lastProblemCode: null,
  lastFailedAt: null,
  turnedOffBecause: null,
  sourceAppId: null,
  sourceIndexerId: null,
  createdAt: '2026-09-18T00:00:00.000Z',
  updatedAt: '2026-09-18T00:00:00.000Z',
  ...overrides,
});

/**
 * A sync over a Prowlarr listing what it is given, and the indexers kept beside it.
 *
 * @param indexers - What Prowlarr lists.
 * @param keeping - What Valence keeps already.
 * @returns The sync and the kept indexers.
 */
const aSync = (indexers: JsonValue[], keeping: IndexerRecord[] = []) => {
  const store = createMemoryRecordStore(keeping);
  const arr = aFakeArr({ 'GET /api/v1/indexer': { body: indexers } });

  return {
    store,
    sync: createProwlarrSync({
      indexers: store,
      connect: (app) => createArrCaller(arr.fetch, app),
      now: () => new Date('2026-10-01T00:00:00.000Z'),
    }),
  };
};

describe('createProwlarrSync', () => {
  it('makes an indexer for each of Prowlarr’s, through Prowlarr’s own feed for it', async () => {
    const { store, sync } = aSync([
      listed({}),
      listed({ id: 2, name: 'NZBgeek', protocol: 'usenet', enable: false, priority: 90 }),
      listed({ id: 3, name: 'Something else', protocol: 'unknown' }),
    ]);

    expect(await sync.sync(PROWLARR)).toEqual({ added: 2, updated: 0, removed: 0, unchanged: 0 });
    expect(
      (await store.list()).map(
        ({
          name,
          kind,
          url,
          apiKey,
          priority,
          categories,
          isEnabled,
          sourceAppId,
          sourceIndexerId,
        }) => ({
          name,
          kind,
          url,
          apiKey,
          priority,
          categories,
          isEnabled,
          sourceAppId,
          sourceIndexerId,
        }),
      ),
    ).toEqual([
      {
        name: 'Nyaa.si',
        kind: 'torznab',
        url: 'http://prowlarr:9696/1/api',
        apiKey: 'prowlarr-key',
        priority: 25,
        categories: [2000, 5000],
        isEnabled: true,
        sourceAppId: PROWLARR.id,
        sourceIndexerId: 1,
      },
      {
        name: 'NZBgeek',
        kind: 'newznab',
        url: 'http://prowlarr:9696/2/api',
        apiKey: 'prowlarr-key',
        priority: 50,
        categories: [2000, 5000],
        isEnabled: false,
        sourceAppId: PROWLARR.id,
        sourceIndexerId: 2,
      },
    ]);
  });

  it('keeps step with Prowlarr, and never touches an indexer made by hand', async () => {
    const byHand = kept({});
    const same = kept({
      name: 'Nyaa.si',
      url: 'http://prowlarr:9696/1/api',
      apiKey: 'prowlarr-key',
      categories: [2000, 5000],
      sourceAppId: PROWLARR.id,
      sourceIndexerId: 1,
    });
    const renamed = kept({
      name: 'Old name',
      url: 'http://elsewhere/2/api',
      capabilities: { categories: [], modes: [], limit: null },
      sourceAppId: PROWLARR.id,
      sourceIndexerId: 2,
    });
    const gone = kept({ sourceAppId: PROWLARR.id, sourceIndexerId: 3 });
    const { store, sync } = aSync(
      [listed({}), listed({ id: 2, name: 'New name' })],
      [byHand, same, renamed, gone],
    );

    expect(await sync.sync(PROWLARR)).toEqual({ added: 0, updated: 1, removed: 1, unchanged: 1 });
    expect(await store.find(byHand.id)).toEqual(byHand);
    expect(await store.find(gone.id)).toBeNull();
    expect(await store.find(renamed.id)).toMatchObject({
      name: 'New name',
      url: 'http://prowlarr:9696/2/api',
      capabilities: null,
      updatedAt: '2026-10-01T00:00:00.000Z',
    });
  });

  it('leaves off an indexer Valence switched off for failing, until it is tested again', async () => {
    const failing = kept({
      name: 'Nyaa.si',
      url: 'http://prowlarr:9696/1/api',
      apiKey: 'prowlarr-key',
      categories: [2000, 5000],
      isEnabled: false,
      turnedOffBecause: sayVerbatim('Turned off after 5 failures'),
      sourceAppId: PROWLARR.id,
      sourceIndexerId: 1,
    });
    const { store, sync } = aSync([listed({})], [failing]);

    expect(await sync.sync(PROWLARR)).toMatchObject({ unchanged: 1 });
    expect(await store.find(failing.id)).toMatchObject({ isEnabled: false });
  });

  it('removes every indexer a Prowlarr brought in, once it is let go', async () => {
    const { store, sync } = aSync(
      [],
      [kept({ sourceAppId: PROWLARR.id, sourceIndexerId: 1 }), kept({})],
    );

    expect(await sync.forget(PROWLARR)).toBe(1);
    expect(await store.list()).toHaveLength(1);
  });
});
