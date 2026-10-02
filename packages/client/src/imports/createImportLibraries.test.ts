import { afterEach, describe, expect, it, vi } from 'vitest';
import { createImportLibraries } from './createImportLibraries';

afterEach(() => {
  vi.unstubAllGlobals();
});

const ANSWER = {
  libraries: [{ sourcePath: '/data', libraryId: 'lib', jobId: 'job', problem: null }],
};

describe('createImportLibraries', () => {
  it('asks the server and reads its answer', async () => {
    const fetchMock = vi
      .fn<
        (
          path: string,
          init: { method: string; body?: string },
        ) => Promise<{ ok: boolean; json: () => Promise<object> }>
      >()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve(ANSWER) });

    vi.stubGlobal('fetch', fetchMock);

    expect(
      await createImportLibraries('source', {
        libraries: [{ sourceLibraryId: 'l', sourcePath: '/data', name: 'Films', kind: 'movies' }],
      }),
    ).toEqual({ kind: 'answered', value: ANSWER });

    const [path, init] = fetchMock.mock.calls[0] ?? ['', { method: '' }];

    expect(path).toBe('/api/admin/imports/source/libraries');
    expect(init).toMatchObject({ method: 'POST', credentials: 'same-origin' });
    expect(JSON.parse(init.body ?? '')).toEqual({
      libraries: [{ sourceLibraryId: 'l', sourcePath: '/data', name: 'Films', kind: 'movies' }],
    });
  });

  it('passes on the server’s refusal', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: 'No.' }) }),
    );

    expect(
      await createImportLibraries('source', {
        libraries: [{ sourceLibraryId: 'l', sourcePath: '/data', name: 'Films', kind: 'movies' }],
      }),
    ).toEqual({ kind: 'refused', refusal: { message: 'No.' } });
  });
});
