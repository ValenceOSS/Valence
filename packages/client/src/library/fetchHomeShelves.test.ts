import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchHomeShelves } from './fetchHomeShelves';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ shelves: [], cursor: null }),
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchHomeShelves', () => {
  it('asks for the first page with the libraries and leanings, and no cursor', async () => {
    await expect(
      fetchHomeShelves({ libraryIds: ['a', 'b'], leaning: ['Drama'], cursor: '', count: 10 }),
    ).resolves.toEqual({ shelves: [], cursor: null });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/home-shelves?libraryIds=a%2Cb&count=10&leaning=Drama',
      expect.anything(),
    );
  });

  it('carries on from where the last page left off', async () => {
    await fetchHomeShelves({ libraryIds: ['a'], leaning: [], cursor: 'next', count: 10 });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/home-shelves?libraryIds=a&count=10&cursor=next',
      expect.anything(),
    );
  });
});
