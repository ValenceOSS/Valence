import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { artworkAddresses } from './artworkAddresses';
import { fetchSeasonalFilms } from './fetchSeasonalFilms';

const fetchMock = vi.fn();

const said = (body: object, ok = true) => ({ ok, json: () => Promise.resolve(body) });

const A_FILM = {
  id: '6f1d2c3b-4a59-4e8f-9d7c-1b2a3c4d5e6f',
  libraryId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  title: 'Two',
  year: 2026,
  durationSeconds: 5400,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-09-01T00:00:00.000Z',
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchSeasonalFilms', () => {
  it('reads the films of the season asked for, best rated first', async () => {
    fetchMock.mockResolvedValue(said({ items: [A_FILM] }));

    const found = await fetchSeasonalFilms('christmas', 12);

    expect(found.map((one) => one.title)).toEqual(['Two']);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/seasonal-films?season=christmas&limit=12',
      expect.anything(),
    );
  });

  it('notes where their pictures are served by name', async () => {
    fetchMock.mockResolvedValue(said({ items: [{ ...A_FILM, artwork: { poster: '/named' } }] }));

    await fetchSeasonalFilms('christmas', 12);

    expect(artworkAddresses.of(A_FILM.id, 'poster', 0)).toBe('/named');
  });

  it('fails where the server would not answer', async () => {
    fetchMock.mockResolvedValue(said({}, false));

    await expect(fetchSeasonalFilms('christmas', 12)).rejects.toThrow();
  });
});
