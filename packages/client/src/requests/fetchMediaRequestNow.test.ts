import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchMediaRequestNow } from './fetchMediaRequestNow';

const fetchMock = vi.fn<(input: string) => Promise<Response>>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchMediaRequestNow', () => {
  it('reads which indexers a request is asking', async () => {
    const searching = {
      stage: 'search',
      startedAt: '2026-09-19T00:00:00.000Z',
      indexers: [{ name: 'TorrentGalaxy', state: 'answered', found: 4 }],
    };
    fetchMock.mockResolvedValue(new Response(JSON.stringify(searching)));

    await expect(fetchMediaRequestNow('r1')).resolves.toEqual(searching);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/requests/media/r1/now');
  });

  it('reads that a request is doing nothing', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(null)));

    await expect(fetchMediaRequestNow('r1')).resolves.toBeNull();
  });
});
