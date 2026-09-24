import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { searchLibraryFiles } from './searchLibraryFiles';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type Answer = { ok: boolean; status: number; json: () => Promise<JsonValue> };

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Answer>>();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ entries: [], isTruncated: false }),
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('searchLibraryFiles', () => {
  it('asks below the folder it is in', async () => {
    await searchLibraryFiles('arrival', '/media/films');

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      '/api/admin/files/search?words=arrival&within=%2Fmedia%2Ffilms',
    );
  });

  it('asks below every library where it is in none', async () => {
    await searchLibraryFiles('arrival', null);

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/admin/files/search?words=arrival');
  });
});
