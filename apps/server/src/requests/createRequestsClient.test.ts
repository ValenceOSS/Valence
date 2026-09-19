import { describe, expect, it, vi } from 'vitest';
import { createRequestsClient } from './createRequestsClient';

const A_SECRET = 'a-secret-long-enough-to-be-worth-keeping';

const A_STATUS = {
  version: '0.4.0',
  vpn: {
    isConfigured: false,
    isUp: null,
    publicAddress: null,
    country: null,
    checkedAt: null,
    problem: null,
  },
  indexers: { total: 0, enabled: 0, failing: [] },
};

/**
 * The service, answering the one way asked.
 */
const answering = (status: number, body: object) =>
  vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));

describe('createRequestsClient', () => {
  it('reads what the service says about itself, presenting the secret', async () => {
    const fetch = answering(200, A_STATUS);
    const client = createRequestsClient({
      address: 'http://requests:8421',
      secret: A_SECRET,
      fetch,
    });

    expect(await client.readStatus()).toEqual({ kind: 'answered', status: A_STATUS });
    expect(fetch).toHaveBeenCalledWith(
      'http://requests:8421/api/status',
      expect.objectContaining({ headers: { Authorization: `Bearer ${A_SECRET}` } }),
    );
  });

  it('says when the secrets do not match', async () => {
    const client = createRequestsClient({
      address: 'http://requests:8421',
      secret: A_SECRET,
      fetch: answering(401, {}),
    });

    expect(await client.readStatus()).toEqual({
      kind: 'silent',
      reason: 'http://requests:8421 refused the secret; REQUESTS_SECRET must be the same on both',
    });
  });

  it('says what any other failure answered', async () => {
    const client = createRequestsClient({
      address: 'http://requests:8421',
      secret: A_SECRET,
      fetch: answering(502, {}),
    });

    expect(await client.readStatus()).toEqual({
      kind: 'silent',
      reason: 'http://requests:8421 answered 502',
    });
  });

  it('says when something else is answering at that address', async () => {
    const client = createRequestsClient({
      address: 'http://requests:8421',
      secret: A_SECRET,
      fetch: answering(200, { hello: 'world' }),
    });

    expect(await client.readStatus()).toEqual({
      kind: 'silent',
      reason: 'http://requests:8421 answered, but not as the requests service',
    });
  });

  it('says when nothing answers at all', async () => {
    const client = createRequestsClient({
      address: 'http://requests:8421',
      secret: A_SECRET,
      fetch: () => Promise.reject(new Error('connect ECONNREFUSED')),
    });

    expect(await client.readStatus()).toEqual({
      kind: 'silent',
      reason: 'http://requests:8421 did not answer',
    });
  });

  describe('indexers and searching', () => {
    const AN_INDEXER = {
      id: '0f8fad5b-d9cb-469f-a165-70867728950e',
      name: 'Jackett',
      kind: 'torznab',
      url: 'http://jackett:9117/',
      hasApiKey: true,
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

    const A_TEST = { isWorking: true, problem: null, capabilities: null };

    const A_DRAFT = { name: 'Jackett', kind: 'torznab' as const, url: 'http://jackett:9117/' };

    /**
     * A client over a service that answers the one way.
     */
    const aClient = (status: number, body: object | null) => {
      const fetch = vi.fn(() =>
        Promise.resolve(new Response(body === null ? null : JSON.stringify(body), { status })),
      );

      return {
        fetch,
        client: createRequestsClient({ address: 'http://requests:8421', secret: A_SECRET, fetch }),
      };
    };

    it('lists the indexers', async () => {
      const { client, fetch } = aClient(200, [AN_INDEXER]);

      expect(await client.listIndexers()).toEqual({ kind: 'answered', value: [AN_INDEXER] });
      expect(fetch).toHaveBeenCalledWith(
        'http://requests:8421/api/indexers',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('adds one, sending what to add', async () => {
      const { client, fetch } = aClient(201, AN_INDEXER);

      expect(await client.addIndexer(A_DRAFT)).toEqual({ kind: 'answered', value: AN_INDEXER });
      expect(fetch).toHaveBeenCalledWith(
        'http://requests:8421/api/indexers',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(A_DRAFT),
          headers: { Authorization: `Bearer ${A_SECRET}`, 'content-type': 'application/json' },
        }),
      );
    });

    it('changes one', async () => {
      const { client, fetch } = aClient(200, AN_INDEXER);

      expect((await client.changeIndexer(AN_INDEXER.id, { priority: 3 })).kind).toBe('answered');
      expect(fetch).toHaveBeenCalledWith(
        `http://requests:8421/api/indexers/${AN_INDEXER.id}`,
        expect.objectContaining({ method: 'PATCH' }),
      );
    });

    it('removes one', async () => {
      const { client } = aClient(204, null);

      expect(await client.removeIndexer(AN_INDEXER.id)).toEqual({ kind: 'answered', value: null });
    });

    it('tests one that is kept, and tries one that is not yet', async () => {
      const { client, fetch } = aClient(200, A_TEST);

      expect(await client.testIndexer(AN_INDEXER.id)).toEqual({ kind: 'answered', value: A_TEST });
      expect(await client.tryIndexer(A_DRAFT)).toEqual({ kind: 'answered', value: A_TEST });
      expect(await client.tryIndexer(A_DRAFT, AN_INDEXER.id)).toEqual({
        kind: 'answered',
        value: A_TEST,
      });
      expect(fetch.mock.calls.map((call) => String(call.at(0)))).toEqual([
        `http://requests:8421/api/indexers/${AN_INDEXER.id}/test`,
        'http://requests:8421/api/indexers/try',
        `http://requests:8421/api/indexers/${AN_INDEXER.id}/try`,
      ]);
    });

    it('searches', async () => {
      const { client } = aClient(200, { releases: [], indexers: [] });

      expect(await client.search({ query: 'dune' })).toEqual({
        kind: 'answered',
        value: { releases: [], indexers: [] },
      });
    });

    it('passes on what the service said when it refused', async () => {
      const { client } = aClient(404, { error: 'No such indexer.' });

      expect(await client.testIndexer(AN_INDEXER.id)).toEqual({
        kind: 'refused',
        status: 404,
        error: 'No such indexer.',
      });
    });

    it('still says it refused where the service gave no reason', async () => {
      const { client } = aClient(400, null);

      expect(await client.addIndexer(A_DRAFT)).toEqual({
        kind: 'refused',
        status: 400,
        error: 'The requests service refused that.',
      });
    });

    it('says the service is silent where it could not be heard', async () => {
      const { client } = aClient(503, {});

      expect(await client.listIndexers()).toEqual({
        kind: 'silent',
        reason: 'http://requests:8421 answered 503',
      });
    });

    it('says a status that was refused is a silent one', async () => {
      const { client } = aClient(404, { error: 'Not here.' });

      expect(await client.readStatus()).toEqual({
        kind: 'silent',
        reason: 'http://requests:8421 refused to say how it is',
      });
    });

    it('says something answered that was not the service, where it answered something else', async () => {
      const fetch = vi.fn(() => Promise.resolve(new Response('<html>', { status: 200 })));
      const client = createRequestsClient({
        address: 'http://requests:8421',
        secret: A_SECRET,
        fetch,
      });

      expect(await client.listIndexers()).toEqual({
        kind: 'silent',
        reason: 'http://requests:8421 answered, but not as the requests service',
      });
    });
  });
});
