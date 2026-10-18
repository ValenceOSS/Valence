import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchUpNext } from './fetchUpNext';

const fetchMock = vi.fn();

const said = (body: object, ok = true) => ({ ok, json: () => Promise.resolve(body) });

const AN_EPISODE = {
  id: '6f1d2c3b-4a59-4e8f-9d7c-1b2a3c4d5e6f',
  libraryId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  title: 'Three',
  year: 2026,
  durationSeconds: 1500,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-09-01T00:00:00.000Z',
  hasPoster: false,
  hasBackdrop: false,
  hasLogo: false,
  seriesId: '7a6b5c4d-3e2f-4a1b-8c9d-0e1f2a3b4c5d',
  seriesTitle: 'A Show',
  seasonNumber: 1,
  episodeNumber: 3,
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchUpNext', () => {
  it('reads the next episode of each programme, with when the one before it was watched', async () => {
    fetchMock.mockResolvedValue(
      said({ episodes: [{ episode: AN_EPISODE, lastWatchedAt: '2026-10-02T00:00:00.000Z' }] }),
    );

    const found = await fetchUpNext();

    expect(found.map((one) => [one.episode.id, one.lastWatchedAt])).toEqual([
      [AN_EPISODE.id, '2026-10-02T00:00:00.000Z'],
    ]);
    expect(fetchMock).toHaveBeenCalledWith('/api/up-next', expect.anything());
  });

  it('fails where the server would not answer', async () => {
    fetchMock.mockResolvedValue(said({}, false));

    await expect(fetchUpNext()).rejects.toThrow();
  });
});
