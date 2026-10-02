import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { linkImportLibrary } from './linkImportLibrary';

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>();

const LINK = { sourceLibraryId: 'films', sourcePath: '/data/films', libraryId: 'lib-1' };

const ANSWER = {
  mappings: [],
  libraries: [],
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('linkImportLibrary', () => {
  it('puts the link on the source and reads the libraries back', async () => {
    fetchMock.mockResolvedValue(Response.json(ANSWER));

    await expect(linkImportLibrary('src/1', LINK)).resolves.toEqual({
      kind: 'answered',
      value: ANSWER,
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/admin/imports/src%2F1/library-links');
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('PUT');
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify(LINK));
  });

  it('passes on the server’s refusal', async () => {
    fetchMock.mockResolvedValue(Response.json({ error: 'No.' }, { status: 404 }));

    await expect(linkImportLibrary('src', LINK)).resolves.toEqual({
      kind: 'refused',
      refusal: { message: 'No.' },
    });
  });
});
