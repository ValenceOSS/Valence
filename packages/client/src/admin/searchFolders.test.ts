import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestFailed } from '@ValenceClient/query/RequestFailed';
import { searchFolders } from './searchFolders';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type Answer = { ok: boolean; status: number; json: () => Promise<JsonValue> };

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Answer>>();

const FOUND = { folders: [{ name: 'Anime', path: '/mnt/media/Anime' }], isTruncated: false };

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(FOUND) });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('searchFolders', () => {
  it('asks below the folder it is in, with the words in the address', async () => {
    await expect(searchFolders('an ime', '/mnt/media')).resolves.toEqual(FOUND);

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      '/api/admin/folders/search?words=an+ime&within=%2Fmnt%2Fmedia',
    );
  });

  it('asks below the places to start from where it is in no folder', async () => {
    await searchFolders('anime', null);

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/admin/folders/search?words=anime');
  });

  it('throws where the server refused', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403, json: () => Promise.resolve(null) });

    await expect(searchFolders('anime', null)).rejects.toBeInstanceOf(RequestFailed);
  });
});
