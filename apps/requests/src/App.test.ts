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
import { createMemoryIndexerStore } from '@ValenceRequests/indexers/createMemoryIndexerStore';
import { createApp } from './App';

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

/**
 * The service, with its database answering or not, and indexers that answer everything.
 */
const aService = (isDatabaseUp = true) => {
  const app = createApp({
    secret: A_SECRET,
    version: '0.4.0',
    readVpn: () => A_VPN,
    isDatabaseUp: () => Promise.resolve(isDatabaseUp),
    indexers: createIndexerService({
      store: createMemoryIndexerStore(),
      client: {
        capabilities: () => Promise.resolve(CAPS),
        search: () => Promise.resolve([]),
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
});
