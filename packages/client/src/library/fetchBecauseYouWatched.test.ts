import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchBecauseYouWatched } from './fetchBecauseYouWatched';

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

describe('fetchBecauseYouWatched', () => {
  it('reads a row for each title watched lately', async () => {
    fetchMock.mockResolvedValue(
      said({
        rows: [
          {
            watched: { title: 'One', mediaId: A_FILM.id, seriesId: null },
            items: [A_FILM],
          },
        ],
      }),
    );

    const rows = await fetchBecauseYouWatched();

    expect(rows.map((row) => [row.watched.title, row.items.length])).toEqual([['One', 1]]);
    expect(fetchMock).toHaveBeenCalledWith('/api/because-you-watched', expect.anything());
  });

  it('fails where the server would not answer', async () => {
    fetchMock.mockResolvedValue(said({}, false));

    await expect(fetchBecauseYouWatched()).rejects.toThrow();
  });
});
