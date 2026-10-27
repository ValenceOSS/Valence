import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchMusicGenres } from './fetchMusicGenres';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type Answer = { ok: boolean; status: number; json: () => Promise<JsonValue> };

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Answer>>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchMusicGenres', () => {
  it('reads the genres of the albums this profile can hear', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ genres: ['Indie', 'Rock'] }),
    });

    await expect(fetchMusicGenres()).resolves.toEqual(['Indie', 'Rock']);
    expect(fetchMock).toHaveBeenCalledWith('/api/music/genres', expect.anything());
  });
});
