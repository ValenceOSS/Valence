import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchLibraryFolder } from './fetchLibraryFolder';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type Answer = { ok: boolean; status: number; json: () => Promise<JsonValue> };

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Answer>>();

const FOLDER = {
  path: '/media/films',
  parent: null,
  libraryId: 'films',
  libraryPath: '/media/films',
  entries: [
    {
      name: 'Arrival.mkv',
      path: '/media/films/Arrival.mkv',
      isFolder: false,
      sizeBytes: 6,
      modifiedAt: '2026-09-24T00:00:00.000Z',
      mediaId: 'm1',
    },
  ],
  isTruncated: false,
};

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(FOLDER) });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchLibraryFolder', () => {
  it('asks for the libraries where no folder is named', async () => {
    await fetchLibraryFolder(null);

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/admin/files');
  });

  it('asks for a folder by its path, and reads what is in it', async () => {
    await expect(fetchLibraryFolder('/media/films')).resolves.toEqual(FOLDER);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/admin/files?path=%2Fmedia%2Ffilms');
  });
});
