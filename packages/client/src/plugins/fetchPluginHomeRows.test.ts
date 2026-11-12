import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { artworkAddresses } from '@ValenceClient/library/artworkAddresses';
import { fetchPluginHomeRows } from './fetchPluginHomeRows';

const fetchMock = vi.fn();

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
  artwork: { backdrop: '/api/artwork/two' },
};

const ROW = { pluginId: 'trakt', pluginName: 'Trakt', rowId: 'trending', title: 'Trending' };

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchPluginHomeRows', () => {
  it('reads the rows plugins add, noting where their pictures are served by name', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ rows: [{ ...ROW, items: [A_FILM] }] }),
    });

    const { rows } = await fetchPluginHomeRows();

    expect(rows.map((row) => row.title)).toEqual(['Trending']);
    expect(artworkAddresses.of(A_FILM.id, 'backdrop', 0)).toBe('/api/artwork/two');
  });

  it('fails where the server would not answer', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: () => Promise.resolve({}) });

    await expect(fetchPluginHomeRows()).rejects.toThrow();
  });
});
