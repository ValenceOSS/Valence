import { describe, expect, it } from 'vitest';
import type { Indexer } from '@ValenceContracts/schemas/Indexer';
import { aSetup } from '@ValenceRequests/arrImport/testing/aSetup';
import { plannedIndexersOf } from './plannedIndexersOf';

/**
 * An indexer Valence keeps, with nothing a test cares about.
 */
const anIndexer = (): Indexer => ({
  id: '0f8fad5b-d9cb-469f-a165-70867728950e',
  name: 'EZTV',
  kind: 'torznab',
  url: 'http://jackett:9117/',
  hasApiKey: true,
  definitionId: null,
  settings: {},
  secretsSet: [],
  privacy: null,
  removesWhenDone: null,
  seedSeconds: null,
  seedRatio: null,
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
  sourceAppId: null,
  sourceIndexerId: null,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
});

describe('plannedIndexersOf', () => {
  it('brings in each feed once, asking once for a key shown masked', async () => {
    const radarr = await aSetup('radarr-v5', 'radarr', 'http://radarr:7878');
    const sonarr = await aSetup('sonarr-v4', 'sonarr', 'http://sonarr:8989');
    const planned = plannedIndexersOf([radarr, sonarr], [], {}, null);
    const geek = planned.find((one) => one.report.name === 'NZBgeek');

    expect(planned.map((one) => one.report.standing)).toEqual(['new', 'new', 'unsupported']);
    expect(geek?.report.from).toEqual(['Radarr', 'Sonarr']);
    expect(geek?.draft).toMatchObject({
      kind: 'newznab',
      url: 'https://api.nzbgeek.info/api',
      apiKey: '',
      priority: 10,
      categories: [2000, 2030, 2040, 2045, 5030, 5040],
    });
    expect(geek?.secret).toEqual({
      key: 'indexer:https://api.nzbgeek.info',
      field: 'apiKey',
      item: 'NZBgeek',
      from: ['Radarr', 'Sonarr'],
    });
  });

  it('leaves out what Prowlarr put there when Prowlarr is brought in too', async () => {
    const radarr = await aSetup('radarr-v5', 'radarr', 'http://radarr:7878');
    const planned = plannedIndexersOf([radarr], [], {}, 'http://prowlarr:9696');

    expect(planned.map((one) => one.report.name)).toEqual(['NZBgeek', 'PassThePopcorn']);
  });

  it('copies a key shown in the clear and the seeding rules, and finds one Valence has', async () => {
    const sonarr = await aSetup('sonarr-v3', 'sonarr', 'http://sonarr:8989');
    const kept = {
      ...anIndexer(),
      url: 'http://jackett:9117/api/v2.0/indexers/eztv/results/torznab/api',
    };
    const [planned] = plannedIndexersOf([sonarr], [kept], {}, null);

    expect(planned?.report.standing).toBe('kept');
    expect(planned?.secret).toBeNull();
    expect(planned?.draft).toMatchObject({
      kind: 'torznab',
      apiKey: 'jackett-key',
      categories: [5030, 5040, 5070],
      seedRatio: 1.5,
      seedSeconds: 259_200,
    });
  });
});
