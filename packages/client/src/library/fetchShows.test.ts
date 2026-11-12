import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { artworkAddresses } from './artworkAddresses';
import { fetchComingUp, fetchShows, fetchShow } from './fetchShows';

const fetchMock = vi.fn();

const said = (body: object, ok = true) => ({ ok, json: () => Promise.resolve(body) });

const LIBRARY = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

const A_SHOW = {
  id: 'ted',
  libraryId: LIBRARY,
  title: 'Ted Lasso',
  seasonCount: 3,
  episodeCount: 34,
  latestAddedAt: '2026-08-10T00:00:00.000Z',
  coverMediaId: '9c858901-8a57-4791-81fe-4c455b099bc9',
  seriesId: null,
};

const NEXT_EPISODE = { seasonNumber: 2, episodeNumber: 3, title: 'Soon', airDate: '2026-12-01' };

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchShows', () => {
  it('reads the programmes in a library, grouped by the server', async () => {
    fetchMock.mockResolvedValue(said({ shows: [A_SHOW] }));

    await expect(fetchShows(LIBRARY)).resolves.toEqual([{ ...A_SHOW, seriesId: null }]);

    expect(fetchMock).toHaveBeenCalledWith(`/api/libraries/${LIBRARY}/shows`, {
      headers: { accept: 'application/json' },
    });
  });

  it('notes where each programme’s pictures are served by name, against its cover', async () => {
    fetchMock.mockResolvedValue(
      said({ shows: [{ ...A_SHOW, artwork: { poster: '/named', titleBackdrop: '/show' } }] }),
    );

    await fetchShows(LIBRARY);

    expect(artworkAddresses.of(A_SHOW.coverMediaId, 'poster', 0)).toBe('/named');
    expect(artworkAddresses.of(A_SHOW.coverMediaId, 'backdrop', 0, true)).toBe('/show');
    expect(artworkAddresses.of(A_SHOW.coverMediaId, 'backdrop', 0)).toBeUndefined();
  });

  it('says so when the server cannot be reached', async () => {
    fetchMock.mockResolvedValue(said({}, false));

    await expect(fetchShows(LIBRARY)).rejects.toThrow();

    fetchMock.mockRejectedValue(new Error('gone'));

    await expect(fetchShows(LIBRARY)).rejects.toThrow();
  });

  it('says so when the answer is not the shape it was promised', async () => {
    fetchMock.mockResolvedValue(said({ shows: 'lots' }));

    await expect(fetchShows(LIBRARY)).rejects.toThrow();
  });
});

describe('fetchShow', () => {
  it('reads one programme and its seasons', async () => {
    fetchMock.mockResolvedValue(said({ ...A_SHOW, seasons: [] }));

    await expect(fetchShow(LIBRARY, 'ted')).resolves.toMatchObject({ id: 'ted', seasons: [] });

    expect(fetchMock).toHaveBeenCalledWith(`/api/libraries/${LIBRARY}/shows/ted`, {
      headers: { accept: 'application/json' },
    });
  });

  it('says so when the answer is not the shape it was promised', async () => {
    fetchMock.mockResolvedValue(said({}, false));

    await expect(fetchShow(LIBRARY, 'ted')).rejects.toThrow();
  });

  it('says so when the answer is not the shape it was promised', async () => {
    fetchMock.mockResolvedValue(said({ id: 'ted' }));

    await expect(fetchShow(LIBRARY, 'ted')).rejects.toThrow();
  });

  it('says so when the server cannot be reached', async () => {
    fetchMock.mockRejectedValue(new Error('gone'));

    await expect(fetchShow(LIBRARY, 'ted')).rejects.toThrow();
  });
});

describe('fetchComingUp', () => {
  it('reads what is coming up, noting where each programme’s poster is served by name', async () => {
    const show = { ...A_SHOW, coverMediaId: '1c858901-8a57-4791-81fe-4c455b099bc9' };

    fetchMock.mockResolvedValue(
      said({
        shows: [{ show: { ...show, artwork: { poster: '/soon' } }, episode: NEXT_EPISODE }],
      }),
    );

    await expect(fetchComingUp()).resolves.toHaveLength(1);
    expect(artworkAddresses.of(show.coverMediaId, 'poster', 0)).toBe('/soon');
  });
});
