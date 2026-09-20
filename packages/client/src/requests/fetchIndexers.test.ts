import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  addIndexer,
  changeIndexer,
  fetchIndexers,
  fetchRelease,
  removeIndexer,
  searchReleases,
  testIndexer,
  tryIndexer,
} from './fetchIndexers';

const AN_INDEXER = {
  id: '0f8fad5b-d9cb-469f-a165-70867728950e',
  name: 'Jackett',
  kind: 'torznab',
  url: 'http://jackett:9117/',
  hasApiKey: true,
  definitionId: null,
  settings: {},
  secretsSet: [],
  privacy: null,
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

const A_TEST = {
  isWorking: false,
  problem: 'The indexer refused the API key',
  capabilities: null,
  captcha: null,
};

const A_DRAFT = { name: 'Jackett', kind: 'torznab' as const, url: 'http://jackett:9117/' };

/**
 * The server, answering every question with the one body.
 */
const answering = (body: object | null, status = 200) => {
  const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(() =>
    Promise.resolve(new Response(body === null ? null : JSON.stringify(body), { status })),
  );

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchIndexers', () => {
  it('reads the indexers', async () => {
    answering([AN_INDEXER]);

    await expect(fetchIndexers()).resolves.toEqual([AN_INDEXER]);
  });
});

describe('addIndexer', () => {
  it('sends the indexer, and reads it back as kept', async () => {
    const fetchMock = answering(AN_INDEXER, 201);

    await expect(addIndexer(A_DRAFT)).resolves.toEqual({ value: AN_INDEXER, refusal: null });
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/requests/indexers', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(A_DRAFT),
    });
  });

  it('says why it was refused, in the server’s words', async () => {
    answering({ error: 'That is not an indexer.' }, 400);

    await expect(addIndexer(A_DRAFT)).resolves.toEqual({
      value: null,
      refusal: { message: 'That is not an indexer.' },
    });
  });

  it('says so when the server cannot be reached', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('offline')));

    await expect(addIndexer(A_DRAFT)).resolves.toEqual({
      value: null,
      refusal: { message: 'The server could not be reached.' },
    });
  });
});

describe('changing, testing and removing one', () => {
  it('changes one', async () => {
    const fetchMock = answering(AN_INDEXER);

    await expect(changeIndexer(AN_INDEXER.id, { priority: 3 })).resolves.toEqual({
      value: AN_INDEXER,
      refusal: null,
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`/api/admin/requests/indexers/${AN_INDEXER.id}`);
  });

  it('removes one', async () => {
    answering(null, 204);

    await expect(removeIndexer(AN_INDEXER.id)).resolves.toBeNull();
  });

  it('tests one, and tries one before and after it is kept', async () => {
    const fetchMock = answering(A_TEST);

    await expect(testIndexer(AN_INDEXER.id)).resolves.toEqual({ value: A_TEST, refusal: null });
    await expect(tryIndexer(A_DRAFT)).resolves.toEqual({ value: A_TEST, refusal: null });
    await expect(tryIndexer(A_DRAFT, AN_INDEXER.id)).resolves.toEqual({
      value: A_TEST,
      refusal: null,
    });
    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      `/api/admin/requests/indexers/${AN_INDEXER.id}/test`,
      '/api/admin/requests/indexers/try',
      `/api/admin/requests/indexers/${AN_INDEXER.id}/try`,
    ]);
  });
});

describe('searchReleases', () => {
  it('searches, and reads what came back', async () => {
    answering({ releases: [], indexers: [] });

    await expect(searchReleases({ query: 'dune' })).resolves.toEqual({
      releases: [],
      indexers: [],
      judgements: [],
      pickedId: null,
    });
  });

  it('throws where the search was refused', async () => {
    answering({ error: 'The requests service could not be heard.' }, 502);

    await expect(searchReleases({ query: 'dune' })).rejects.toMatchObject({ status: 502 });
  });
});

describe('fetchRelease', () => {
  it('gives a torrent as a file named as the server named it', async () => {
    const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(() =>
      Promise.resolve(
        new Response(new Uint8Array([0x64]), {
          headers: {
            'content-type': 'application/x-bittorrent',
            'content-disposition': 'attachment; filename="release.torrent"',
          },
        }),
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    const { value, refusal } = await fetchRelease(AN_INDEXER.id, 'https://x/1');

    expect(refusal).toBeNull();
    expect(value?.kind === 'file' ? [value.name, value.file.size] : null).toEqual([
      'release.torrent',
      1,
    ]);
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify({ url: 'https://x/1' }));
  });

  it('names a file the server did not name', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(new Uint8Array([1]))));

    const { value } = await fetchRelease(AN_INDEXER.id, 'x');

    expect(value?.kind === 'file' ? value.name : null).toBe('release.torrent');
  });

  it('gives a magnet link as one', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve(
        new Response(JSON.stringify({ magnet: 'magnet:?xt=urn:btih:A' }), {
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );

    await expect(fetchRelease(AN_INDEXER.id, 'x')).resolves.toEqual({
      value: { kind: 'magnet', url: 'magnet:?xt=urn:btih:A' },
      refusal: null,
    });
  });

  it('says why it could not be fetched', async () => {
    answering({ error: 'The site answered 410' }, 502);

    await expect(fetchRelease(AN_INDEXER.id, 'x')).resolves.toEqual({
      value: null,
      refusal: { message: 'The site answered 410' },
    });

    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('offline')));

    await expect(fetchRelease(AN_INDEXER.id, 'x')).resolves.toEqual({
      value: null,
      refusal: { message: 'The server could not be reached.' },
    });
  });
});
