import { describe, expect, it } from 'vitest';
import { createArrCaller } from '@ValenceRequests/arrApps/createArrCaller';
import { aFakeArr } from '@ValenceRequests/arrApps/testing/aFakeArr';
import { arrFixture } from '@ValenceRequests/arrImport/testing/arrFixture';
import { readSeerrSetup } from './readSeerrSetup';

const SOURCE = {
  kind: 'overseerr' as const,
  url: 'http://overseerr:5055',
  apiKey: 'overseerr-key',
  name: 'Overseerr',
  version: '1.35.0',
  foundThrough: null,
  problem: null,
};

describe('readSeerrSetup', () => {
  it('reads the servers Overseerr sends to, with their keys in the clear, and what is waiting', async () => {
    const arr = aFakeArr(arrFixture('overseerr'));
    const setup = await readSeerrSetup(createArrCaller(arr.fetch, SOURCE), SOURCE);

    expect(setup.servers.map(({ kind, url, apiKey }) => ({ kind, url, apiKey }))).toEqual([
      { kind: 'radarr', url: 'http://radarr:7878', apiKey: 'radarr-plain-key' },
      { kind: 'sonarr', url: 'http://sonarr:8989', apiKey: 'sonarr-plain-key' },
    ]);
    expect(setup.requests.map((one) => one.id)).toEqual([11, 12, 13]);
    expect(arr.asked.find((one) => one.path === '/api/v1/request')?.query.get('filter')).toBe(
      'unavailable',
    );
    expect(arr.asked.every((one) => one.method === 'GET')).toBe(true);
  });

  it('reads every page of requests', async () => {
    const aRequest = (id: number) => ({ id, status: 1, type: 'movie', media: { tmdbId: id } });
    const arr = aFakeArr({
      'GET /api/v1/settings/radarr': { body: [] },
      'GET /api/v1/settings/sonarr': { body: [] },
      'GET /api/v1/request': (asked) =>
        asked.query.get('skip') === '0'
          ? {
              body: {
                pageInfo: { pages: 2, page: 1 },
                results: Array.from({ length: 100 }, (_, index) => aRequest(index + 1)),
              },
            }
          : { body: { pageInfo: { pages: 2, page: 2 }, results: [aRequest(101)] } },
    });
    const setup = await readSeerrSetup(createArrCaller(arr.fetch, SOURCE), SOURCE);

    expect(setup.requests).toHaveLength(101);
    expect(arr.asked.filter((one) => one.path === '/api/v1/request')).toHaveLength(2);
  });
});
