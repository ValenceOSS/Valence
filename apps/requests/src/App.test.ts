import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import {
  IndexerSchema,
  IndexerTestSchema,
  ReleaseSearchOutcomeSchema,
} from '@ValenceContracts/schemas/Indexer';
import { RequestsStatusSchema } from '@ValenceContracts/schemas/Requests';
import type { IndexerCapabilities } from '@ValenceContracts/schemas/Indexer';
import type { RequestsVpn } from '@ValenceContracts/schemas/Requests';
import { createIndexerService } from '@ValenceRequests/indexers/createIndexerService';
import { createMemoryRecordStore } from '@ValenceRequests/stores/createMemoryRecordStore';
import type { IndexerRecord } from '@ValenceRequests/indexers/IndexerRecord';
import { createApp } from './App';
import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import {
  IndexerCatalogueSchema,
  IndexerDefinitionDetailSchema,
} from '@ValenceContracts/schemas/IndexerDefinition';

const A_SECRET = 'a-secret-long-enough-to-be-worth-keeping';

const A_VPN: RequestsVpn = {
  isConfigured: true,
  isUp: true,
  publicAddress: '203.0.113.7',
  country: 'Netherlands',
  checkedAt: '2026-09-19T12:00:00.000Z',
  problem: null,
};

const CAPS: IndexerCapabilities = { categories: [], modes: [], limit: null };

const A_DRAFT = { name: 'Jackett', kind: 'torznab', url: 'http://jackett:9117/', apiKey: 'a-key' };

const CATALOGUE = {
  definitions: [
    {
      id: 'alpha',
      name: 'Alpha',
      description: '',
      language: 'en-US',
      privacy: 'public' as const,
      protocol: 'torrent' as const,
      categories: ['Movies'],
    },
  ],
  updatedAt: '2026-09-19T00:00:00.000Z',
  source: 'Prowlarr/Indexers@master/definitions/v11',
  problem: null,
};

const DETAIL = {
  ...CATALOGUE.definitions[0],
  id: 'alpha',
  name: 'Alpha',
  description: '',
  language: 'en-US',
  privacy: 'public' as const,
  protocol: 'torrent' as const,
  categories: ['Movies'],
  links: ['https://alpha.example/'],
  settings: [],
  standardCategories: [],
  hasCaptcha: false,
  needsFlareSolverr: false,
};

/**
 * What fetching a release gives for each address.
 */
const fetchRelease = (url: string) => {
  if (url === 'gone') {
    return Promise.reject(new IndexerFailure('The site answered 410'));
  }

  if (url === 'broken') {
    return Promise.reject(new Error('boom'));
  }

  return Promise.resolve(
    url.startsWith('magnet:')
      ? { kind: 'magnet' as const, url }
      : {
          kind: url.endsWith('.nzb') ? ('nzb' as const) : ('torrent' as const),
          bytes: new Uint8Array([0x64, 0x65]),
        },
  );
};

const THE_REST = {
  definitions: {
    catalogue: () => Promise.resolve(CATALOGUE),
    refresh: () => Promise.resolve(CATALOGUE),
    detail: (id: string) => Promise.resolve(id === 'alpha' ? DETAIL : null),
  },
  secret: A_SECRET,
  version: '0.4.0',
  readVpn: () => A_VPN,
  isDatabaseUp: () => Promise.resolve(true),
  indexers: createIndexerService({
    store: createMemoryRecordStore<IndexerRecord>(),
    client: {
      capabilities: () => Promise.resolve(CAPS),
      search: () => Promise.resolve([]),
      download: () => Promise.resolve({ kind: 'magnet' as const, url: 'magnet:?' }),
    },
  }),
};

/**
 * The service, with its database answering or not, and indexers that answer everything.
 */
const aService = (isDatabaseUp = true) => {
  const app = createApp({
    ...THE_REST,
    isDatabaseUp: () => Promise.resolve(isDatabaseUp),
    indexers: createIndexerService({
      store: createMemoryRecordStore<IndexerRecord>(),
      client: {
        capabilities: () => Promise.resolve(CAPS),
        search: () => Promise.resolve([]),
        download: (_indexer, url) => fetchRelease(url),
      },
    }),
  });

  const ask = (path: string, method = 'GET', body?: object | string) =>
    app.request(path, {
      method,
      headers: { Authorization: `Bearer ${A_SECRET}`, 'content-type': 'application/json' },
      ...(body === undefined
        ? {}
        : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
    });

  const add = async () =>
    IndexerSchema.parse(await (await ask('/api/indexers', 'POST', A_DRAFT)).json());

  return { app, ask, add };
};

describe('createApp', () => {
  it('answers a health check without the secret', async () => {
    const response = await aService().app.request('/health');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it('fails the health check when the database does not answer', async () => {
    expect((await aService(false).app.request('/health')).status).toBe(503);
  });

  it('says what it is, how the VPN is and how the indexers are, to whoever holds the secret', async () => {
    const response = await aService().ask('/api/status');

    expect(response.status).toBe(200);
    expect(RequestsStatusSchema.parse(await response.json())).toEqual({
      version: '0.4.0',
      vpn: A_VPN,
      indexers: { total: 0, enabled: 0, failing: [] },
    });
  });

  it('turns away anybody without the secret', async () => {
    expect((await aService().app.request('/api/status')).status).toBe(401);
  });

  it('keeps what it was given for downloads behind the secret too', async () => {
    const downloads = new Hono();

    downloads.get('/downloads', (context) => context.json({ clients: [] }));

    const app = createApp({ ...THE_REST, downloads });

    expect((await app.request('/api/downloads')).status).toBe(401);
    expect(
      (await app.request('/api/downloads', { headers: { Authorization: `Bearer ${A_SECRET}` } }))
        .status,
    ).toBe(200);
  });

  it('turns away the wrong secret', async () => {
    const response = await aService().app.request('/api/indexers', {
      headers: { Authorization: 'Bearer a-guess-that-is-not-the-secret-at-all' },
    });

    expect(response.status).toBe(401);
  });

  describe('indexers', () => {
    it('adds one, and lists it without its key', async () => {
      const { ask, add } = aService();
      const added = await add();

      expect(added).toMatchObject({ name: 'Jackett', hasApiKey: true });
      expect(await (await ask('/api/indexers')).json()).toEqual([added]);
      expect(JSON.stringify(added)).not.toContain('a-key');
    });

    it('refuses to add something that is not an indexer', async () => {
      const { ask } = aService();

      expect((await ask('/api/indexers', 'POST', { name: 'Nothing' })).status).toBe(400);
      expect((await ask('/api/indexers', 'POST', 'not json')).status).toBe(400);
    });

    it('changes one', async () => {
      const { ask, add } = aService();
      const { id } = await add();
      const response = await ask(`/api/indexers/${id}`, 'PATCH', { priority: 3 });

      expect(IndexerSchema.parse(await response.json()).priority).toBe(3);
    });

    it('refuses a change that is not one, or to an indexer that is not there', async () => {
      const { ask, add } = aService();
      const { id } = await add();

      expect((await ask(`/api/indexers/${id}`, 'PATCH', { priority: 'high' })).status).toBe(400);
      expect(
        (await ask('/api/indexers/7c9e6679-7425-40de-944b-e07fc1f90ae7', 'PATCH', { priority: 3 }))
          .status,
      ).toBe(404);
    });

    it('removes one, once', async () => {
      const { ask, add } = aService();
      const { id } = await add();

      expect((await ask(`/api/indexers/${id}`, 'DELETE')).status).toBe(204);
      expect((await ask(`/api/indexers/${id}`, 'DELETE')).status).toBe(404);
    });

    it('tests one that is kept', async () => {
      const { ask, add } = aService();
      const { id } = await add();
      const response = await ask(`/api/indexers/${id}/test`, 'POST');

      expect(IndexerTestSchema.parse(await response.json())).toEqual({
        isWorking: true,
        problem: null,
        capabilities: CAPS,
        captcha: null,
      });
      expect(
        (await ask('/api/indexers/7c9e6679-7425-40de-944b-e07fc1f90ae7/test', 'POST')).status,
      ).toBe(404);
    });

    it('tries one before it is kept, and a change before it is saved', async () => {
      const { ask, add } = aService();
      const { id } = await add();

      expect((await ask('/api/indexers/try', 'POST', A_DRAFT)).status).toBe(200);
      expect((await ask(`/api/indexers/${id}/try`, 'POST', A_DRAFT)).status).toBe(200);
      expect((await ask('/api/indexers/try', 'POST', {})).status).toBe(400);
      expect((await ask(`/api/indexers/${id}/try`, 'POST', {})).status).toBe(400);
    });
  });

  describe('searching', () => {
    it('searches every indexer', async () => {
      const { ask, add } = aService();

      await add();

      const response = await ask('/api/search', 'POST', { query: 'dune' });

      expect(ReleaseSearchOutcomeSchema.parse(await response.json()).indexers).toHaveLength(1);
    });

    it('refuses a search that is not one', async () => {
      expect((await aService().ask('/api/search', 'POST', { mode: 'everything' })).status).toBe(
        400,
      );
    });
  });

  describe('definitions', () => {
    it('lists the catalogue, and refreshes it', async () => {
      const { ask } = aService();

      expect(IndexerCatalogueSchema.parse(await (await ask('/api/definitions')).json())).toEqual(
        CATALOGUE,
      );
      expect((await ask('/api/definitions/refresh', 'POST')).status).toBe(200);
    });

    it('describes one definition, and says when there is none', async () => {
      const { ask } = aService();

      expect(
        IndexerDefinitionDetailSchema.parse(await (await ask('/api/definitions/alpha')).json())
          .links,
      ).toEqual(['https://alpha.example/']);
      expect((await ask('/api/definitions/nope')).status).toBe(404);
    });

    it('refuses an indexer whose definition is not in the catalogue, saying so', async () => {
      const response = await aService().ask('/api/indexers', 'POST', {
        name: 'X',
        kind: 'cardigann',
        url: 'https://x.example/',
        definitionId: 'nope',
      });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: 'There is no definition named nope in the catalogue',
      });
    });
  });

  describe('fetching a release', () => {
    it('gives a torrent or an NZB as the file, and a magnet link as JSON', async () => {
      const { ask, add } = aService();
      const { id } = await add();
      const torrent = await ask(`/api/indexers/${id}/download`, 'POST', {
        url: 'https://x.example/1',
      });

      expect(torrent.headers.get('content-type')).toBe('application/x-bittorrent');
      expect(new Uint8Array(await torrent.arrayBuffer())).toEqual(new Uint8Array([0x64, 0x65]));
      expect(
        (
          await ask(`/api/indexers/${id}/download`, 'POST', { url: 'https://x.example/1.nzb' })
        ).headers.get('content-type'),
      ).toBe('application/x-nzb');
      expect(
        await (
          await ask(`/api/indexers/${id}/download`, 'POST', { url: 'magnet:?xt=urn:btih:A' })
        ).json(),
      ).toEqual({
        magnet: 'magnet:?xt=urn:btih:A',
      });
    });

    it('says why a release could not be fetched', async () => {
      const { ask, add } = aService();
      const { id } = await add();
      const gone = await ask(`/api/indexers/${id}/download`, 'POST', { url: 'gone' });

      expect(gone.status).toBe(502);
      expect(await gone.json()).toEqual({ error: 'The site answered 410' });
      expect(
        await (await ask(`/api/indexers/${id}/download`, 'POST', { url: 'broken' })).json(),
      ).toEqual({
        error: 'The release could not be fetched.',
      });
    });

    it('refuses to fetch without an address, or from an indexer that is not there', async () => {
      const { ask } = aService();

      expect(
        (await ask('/api/indexers/7c9e6679-7425-40de-944b-e07fc1f90ae7/download', 'POST', {}))
          .status,
      ).toBe(400);
      expect(
        (
          await ask('/api/indexers/7c9e6679-7425-40de-944b-e07fc1f90ae7/download', 'POST', {
            url: 'x',
          })
        ).status,
      ).toBe(404);
    });
  });
});
