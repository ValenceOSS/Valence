import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchCatalogue, fetchDefinition, refreshCatalogue } from './fetchDefinitions';

const CATALOGUE = {
  definitions: [],
  updatedAt: null,
  source: 'Prowlarr/Indexers@master/definitions/v11',
  problem: null,
};

const DETAIL = {
  id: '1337x',
  name: '1337x',
  description: '',
  language: 'en-US',
  privacy: 'public',
  protocol: 'torrent',
  categories: [],
  links: ['https://1337x.to/'],
  settings: [],
  standardCategories: [],
  hasCaptcha: false,
  isBehindCloudflare: false,
};

/**
 * The server, answering every question with the one body.
 */
const answering = (body: object, status = 200) => {
  const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(() =>
    Promise.resolve(new Response(JSON.stringify(body), { status })),
  );

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchDefinitions', () => {
  it('reads the catalogue', async () => {
    answering(CATALOGUE);

    await expect(fetchCatalogue()).resolves.toEqual(CATALOGUE);
  });

  it('refreshes the catalogue', async () => {
    const fetchMock = answering(CATALOGUE);

    await expect(refreshCatalogue()).resolves.toEqual(CATALOGUE);
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/requests/definitions/refresh', {
      method: 'POST',
      credentials: 'same-origin',
    });
  });

  it('throws where refreshing was refused', async () => {
    answering({ error: 'no' }, 502);

    await expect(refreshCatalogue()).rejects.toMatchObject({ status: 502 });
  });

  it('reads one definition', async () => {
    const fetchMock = answering(DETAIL);

    await expect(fetchDefinition('1337x')).resolves.toEqual(DETAIL);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/admin/requests/definitions/1337x');
  });
});
