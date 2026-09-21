import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchAskable,
  fetchCatalogueBrowse,
  fetchCatalogueGenres,
  fetchDiscover,
  fetchRequestProgress,
  searchAskable,
} from './fetchAskable';

const DUNE = {
  kind: 'film',
  id: '438631',
  title: 'Dune',
  subtitle: null,
  year: 2021,
  overview: null,
  posterUrl: null,
  standing: { status: 'askable', mediaId: null, requestId: null, requestState: null },
};

/**
 * Answers every request with the body given.
 */
const answering = (body: object) => {
  const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(() =>
    Promise.resolve(Response.json(body)),
  );

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchAskable', () => {
  it('reads the shelves of things to ask for, and the studios', async () => {
    const asked = answering({
      shelves: [
        {
          id: 'trending-films',
          title: 'Trending films',
          titles: [DUNE],
          browse: { kind: 'film', list: 'trending', studio: null },
        },
      ],
      studios: [{ id: '2', name: 'Walt Disney Pictures', logoUrl: 'https://p/d.png' }],
    });

    expect(await fetchDiscover()).toMatchObject({
      shelves: [{ id: 'trending-films', titles: [DUNE] }],
      studios: [{ id: '2' }],
    });
    expect(asked.mock.calls[0]?.[0]).toBe('/api/requests/discover');
  });

  it('reads a page of a whole list, by studio where one was chosen', async () => {
    const asked = answering({ titles: [DUNE], page: 2, hasMore: false });

    expect(await fetchCatalogueBrowse({ kind: 'film', list: 'popular', studio: null }, 2)).toEqual({
      titles: [DUNE],
      page: 2,
      hasMore: false,
    });
    expect(asked.mock.calls[0]?.[0]).toBe(
      '/api/requests/catalogue/browse?kind=film&list=popular&page=2',
    );

    const byStudio = answering({ titles: [], page: 1, hasMore: false });

    await fetchCatalogueBrowse({ kind: 'series', list: 'popular', studio: '2' }, 1);

    expect(byStudio.mock.calls[0]?.[0]).toBe(
      '/api/requests/catalogue/browse?kind=series&list=popular&studio=2&page=1',
    );
  });

  it('narrows a page by genre, years and rating, and asks for nothing that was not chosen', async () => {
    const asked = answering({ titles: [], page: 1, hasMore: false });

    await fetchCatalogueBrowse({ kind: 'film', list: 'popular', studio: null }, 1, {
      genre: '878',
      yearFrom: 1990,
      yearTo: 1999,
      minRating: 7,
    });

    expect(asked.mock.calls[0]?.[0]).toBe(
      '/api/requests/catalogue/browse?kind=film&list=popular&genre=878&yearFrom=1990&yearTo=1999&minRating=7&page=1',
    );
  });

  it('reads the genres a list can be narrowed to, for the kind asked about', async () => {
    const asked = answering([{ id: '878', name: 'Science Fiction' }]);

    expect(await fetchCatalogueGenres('film')).toEqual([{ id: '878', name: 'Science Fiction' }]);
    expect(asked.mock.calls[0]?.[0]).toBe('/api/requests/catalogue/genres?kind=film');
  });

  it('searches for things to ask for, of the kind given', async () => {
    const asked = answering([DUNE]);

    expect(await searchAskable('dune & more', 'film')).toEqual([DUNE]);
    expect(asked.mock.calls[0]?.[0]).toBe(
      '/api/requests/catalogue/search?query=dune+%26+more&kind=film',
    );
  });

  it('reads a title’s page by its kind and id', async () => {
    const asked = answering({
      ...DUNE,
      musicBrainzId: null,
      backdropUrl: null,
      genres: [],
      runtimeMinutes: 155,
      cast: [],
      albums: [],
      trailerKey: null,
    });

    expect((await fetchAskable('album', 'deezer-7')).runtimeMinutes).toBe(155);
    expect(asked.mock.calls[0]?.[0]).toBe('/api/requests/catalogue/title/album/deezer-7');
  });

  it('reads how your downloads are going', async () => {
    const asked = answering([]);

    expect(await fetchRequestProgress()).toEqual([]);
    expect(asked.mock.calls[0]?.[0]).toBe('/api/requests/progress');
  });
});
