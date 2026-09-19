import { describe, expect, it, vi } from 'vitest';
import { createIndexerClient } from './createIndexerClient';
import { createPacer } from './createPacer';
import { CaptchaNeeded } from './CaptchaNeeded';
import { readDefinition } from '@ValenceRequests/cardigann/readDefinition';
import { createSiteClient } from '@ValenceRequests/cardigann/createSiteClient';
import type { SiteFetch } from '@ValenceRequests/cardigann/createSiteClient';
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
  definitionId: null,
  settings: {},
  session: null,
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

  describe('downloading', () => {
    it('hands a magnet link straight back', async () => {
      const fetch = answering('');

      expect(
        await createIndexerClient({ fetch, pacer: createPacer() }).download(
          JACKETT,
          'magnet:?xt=urn:btih:A',
        ),
      ).toEqual({
        kind: 'magnet',
        url: 'magnet:?xt=urn:btih:A',
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    it('fetches a torrent, or an NZB from a usenet indexer', async () => {
      const client = createIndexerClient({ fetch: answering('d8:announce'), pacer: createPacer() });

      expect(await client.download(JACKETT, 'http://jackett/dl/1')).toEqual({
        kind: 'torrent',
        bytes: new TextEncoder().encode('d8:announce'),
      });
      expect(
        (await client.download({ ...JACKETT, kind: 'newznab' }, 'https://nzb/get/1')).kind,
      ).toBe('nzb');
    });

    it('says so when the file is not there, or the indexer cannot be reached', async () => {
      await expect(
        createIndexerClient({ fetch: answering('', 404), pacer: createPacer() }).download(
          JACKETT,
          'http://j/1',
        ),
      ).rejects.toThrow('The indexer answered the download with 404');
      await expect(
        createIndexerClient({
          fetch: () => Promise.reject(new TypeError('offline')),
          pacer: createPacer(),
        }).download(JACKETT, 'http://j/1'),
      ).rejects.toThrow('The indexer could not be reached');
    });
  });

  describe('an indexer made from a definition', () => {
    const DEFINITION = readDefinition(`id: alpha
name: Alpha
type: public
links: [https://alpha.example/]
caps:
  categorymappings:
    - {id: 1, cat: Movies}
  modes:
    search: [q]
search:
  paths:
    - path: browse.php
  rows:
    selector: tr
  fields:
    title:
      selector: a
    download:
      selector: a
      attribute: href
`);

    const WITH_CAPTCHA = readDefinition(`id: beta
name: Beta
links: [https://beta.example/]
caps:
  modes:
    search: [q]
login:
  method: form
  path: login.php
  captcha:
    type: image
    selector: img.c
    input: code
search:
  paths:
    - path: browse.php
  rows:
    selector: tr
  fields:
    title:
      selector: a
`);

    const ALPHA = {
      ...JACKETT,
      kind: 'cardigann' as const,
      url: 'https://alpha.example/',
      definitionId: 'alpha',
    };

    /**
     * A site answering every page with the one given, and a client that runs definitions against it.
     */
    const aSite = (
      page: string | Uint8Array,
      headers: Record<string, string> = { 'content-type': 'text/html' },
    ) => {
      const fetch = vi.fn<SiteFetch>(() => Promise.resolve(new Response(page, { headers })));

      return createIndexerClient({
        fetch: answering(''),
        pacer: createPacer(),
        definitions: (id) =>
          Promise.resolve(id === 'alpha' ? DEFINITION : id === 'beta' ? WITH_CAPTCHA : null),
        site: createSiteClient({ fetch }),
      });
    };

    it('tries a search to test it, and says what it can do from its definition', async () => {
      const connection = { ...ALPHA };

      expect(
        await aSite('<table><tr><td><a href="/1">Dune</a></td></tr></table>').capabilities(
          connection,
        ),
      ).toEqual({
        categories: [{ id: 2000, name: 'Movies', subcategories: [] }],
        modes: [{ mode: 'search', parameters: ['q'] }],
        limit: null,
      });
      expect(connection.session).toEqual({ cookies: {}, userAgent: null });
    });

    it('searches it with the engine', async () => {
      expect(
        (
          await aSite('<table><tr><td><a href="/1">Dune</a></td></tr></table>').search(ALPHA, {
            query: 'dune',
          })
        ).map((release) => release.title),
      ).toEqual(['Dune']);
    });

    it('fetches a release with the engine', async () => {
      expect(
        await aSite(new Uint8Array([0x64, 0x65]), {}).download(ALPHA, 'https://alpha.example/dl/1'),
      ).toEqual({
        kind: 'torrent',
        bytes: new Uint8Array([0x64, 0x65]),
      });
    });

    it('asks for the captcha where logging in needs one and no answer was given', async () => {
      const client = aSite('<form></form><img class="c" src="/c.png">');
      const beta = { ...ALPHA, url: 'https://beta.example/', definitionId: 'beta' };

      await expect(client.capabilities(beta)).rejects.toBeInstanceOf(CaptchaNeeded);
      await expect(
        client.capabilities({ ...beta, settings: { CAPTCHA: 'abc' } }),
      ).resolves.toMatchObject({ limit: null });
    });

    it('goes on to test where a captcha is expected but the page shows none', async () => {
      const client = aSite('<form></form>');

      await expect(
        client.capabilities({ ...ALPHA, url: 'https://beta.example/', definitionId: 'beta' }),
      ).resolves.toMatchObject({
        limit: null,
      });
    });

    it('says so where its definition is no longer in the catalogue', async () => {
      await expect(
        aSite('').search({ ...ALPHA, definitionId: 'gone' }, { query: 'x' }),
      ).rejects.toThrow('The definition for this indexer is no longer in the catalogue');
      await expect(
        createIndexerClient({ fetch: answering(''), pacer: createPacer() }).search(
          { ...ALPHA, definitionId: null },
          { query: 'x' },
        ),
      ).rejects.toThrow('The definition for this indexer is no longer in the catalogue');
    });
  });
});
