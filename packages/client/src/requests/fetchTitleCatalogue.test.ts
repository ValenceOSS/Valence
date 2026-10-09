import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchTitleCatalogue, fetchTitleFiles } from './fetchTitleCatalogue';

const ENTRY = {
  key: 'film:1',
  tab: 'films',
  kind: 'film',
  catalogueId: '1',
  title: 'Film',
  subtitle: null,
  year: 2020,
  art: { kind: 'media', id: 'm1' },
  posterUrl: null,
  status: 'notFollowed',
  held: 1,
  total: 1,
  isAudio: false,
  requestId: null,
  mediaId: 'm1',
  libraryId: 'films',
  askedBy: null,
  addedAt: null,
};

/**
 * The server, answering every question with the one body.
 */
const answering = (body: object) => {
  const fetchMock = vi.fn<(input: string) => Promise<Response>>(() =>
    Promise.resolve(Response.json(body)),
  );

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchTitleCatalogue', () => {
  it('reads every title in the Catalogue', async () => {
    const asked = answering({ entries: [ENTRY] });

    expect(await fetchTitleCatalogue()).toEqual([ENTRY]);
    expect(asked.mock.calls[0]?.[0]).toBe('/api/admin/requests/catalogue');
  });

  it('reads the files of one title', async () => {
    const asked = answering({ folder: '/media/Show', files: [] });

    expect(await fetchTitleFiles('series', '42')).toEqual({ folder: '/media/Show', files: [] });
    expect(asked.mock.calls[0]?.[0]).toBe(
      '/api/admin/requests/catalogue/files?kind=series&catalogueId=42',
    );
  });
});
