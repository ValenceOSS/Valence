import { describe, expect, it, vi } from 'vitest';
import { createIndexerClient } from './createIndexerClient';
import { createPacer } from './createPacer';
import type { IndexerConnection } from './createIndexerClient';

const JACKETT: IndexerConnection = {
  id: '0f8fad5b-d9cb-469f-a165-70867728950e',
  name: 'Jackett',
  kind: 'torznab',
  url: 'http://jackett:9117/api/v2.0/indexers/all/results/torznab/',
  apiKey: 'a-key',
  timeoutSeconds: 30,
  requestsPerMinute: null,
  categories: [],
  capabilities: null,
};

const CAPS =
  '<caps><searching><search available="yes" supportedParams="q"/></searching><categories><category id="2000" name="Movies"/></categories></caps>';

const FEED =
  '<rss><channel><item><title>Dune</title><link>http://jackett/dl/1</link></item></channel></rss>';

/**
 * An indexer that answers every question with the one reply.
 */
const answering = (body: string, status = 200) =>
  vi.fn<
    (
      url: string,
      init: { headers: Record<string, string>; signal: AbortSignal },
    ) => Promise<Response>
  >(() => Promise.resolve(new Response(body, { status })));

describe('createIndexerClient', () => {
  it('asks an indexer what it can do, with its key', async () => {
    const fetch = answering(CAPS);
    const client = createIndexerClient({ fetch, pacer: createPacer() });

    expect((await client.capabilities(JACKETT)).categories).toEqual([
      { id: 2000, name: 'Movies', subcategories: [] },
    ]);
    expect(fetch.mock.calls[0]?.[0]).toBe(
      'http://jackett:9117/api/v2.0/indexers/all/results/torznab/api?t=caps&apikey=a-key',
    );
  });

  it('leaves the key off for an indexer that has none', async () => {
    const fetch = answering(CAPS);

    await createIndexerClient({ fetch, pacer: createPacer() }).capabilities({
      ...JACKETT,
      apiKey: '',
    });

    expect(fetch.mock.calls[0]?.[0]).not.toContain('apikey');
  });

  it('searches an indexer, and reads what it found', async () => {
    const fetch = answering(FEED);
    const found = await createIndexerClient({ fetch, pacer: createPacer() }).search(JACKETT, {
      query: 'dune',
    });

    expect(found.map((release) => release.title)).toEqual(['Dune']);
    expect(fetch.mock.calls[0]?.[0]).toContain('t=search&q=dune');
  });

  it('waits its turn before asking an indexer with a limit', async () => {
    const turn = vi.fn(() => Promise.resolve());
    const client = createIndexerClient({ fetch: answering(CAPS), pacer: { turn } });

    await client.capabilities({ ...JACKETT, requestsPerMinute: 10 });

    expect(turn).toHaveBeenCalledWith(JACKETT.id, 10);
  });

  it.each([
    [401, 'The indexer refused the API key'],
    [403, 'The indexer refused the API key'],
    [429, 'The indexer says it has been asked too often'],
    [502, 'The indexer answered 502'],
  ])('says what an answer of %i means', async (status, reason) => {
    const client = createIndexerClient({ fetch: answering('', status), pacer: createPacer() });

    await expect(client.capabilities(JACKETT)).rejects.toThrow(reason);
  });

  it('says so when an indexer cannot be reached', async () => {
    const client = createIndexerClient({
      fetch: () => Promise.reject(new TypeError('fetch failed')),
      pacer: createPacer(),
    });

    await expect(client.capabilities(JACKETT)).rejects.toThrow('The indexer could not be reached');
  });

  it('says how long it waited for an indexer that took too long', async () => {
    const timedOut = new DOMException('The operation timed out.', 'TimeoutError');
    const client = createIndexerClient({
      fetch: () => Promise.reject(timedOut),
      pacer: createPacer(),
    });

    await expect(client.search({ ...JACKETT, timeoutSeconds: 10 }, { query: 'x' })).rejects.toThrow(
      'The indexer did not answer within 10 seconds',
    );
  });
});
