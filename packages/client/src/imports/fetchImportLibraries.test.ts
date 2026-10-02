import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchImportLibraries } from './fetchImportLibraries';

afterEach(() => {
  vi.unstubAllGlobals();
});

const ANSWER = { mappings: [{ from: '/data', to: '/media' }], libraries: [] };

describe('fetchImportLibraries', () => {
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

    expect(await fetchImportLibraries('source')).toEqual({ kind: 'answered', value: ANSWER });

    const [path, init] = fetchMock.mock.calls[0] ?? ['', { method: '' }];

    expect(path).toBe('/api/admin/imports/source/libraries');
    expect(init).toMatchObject({ method: 'GET', credentials: 'same-origin' });
  });

  it('passes on the server’s refusal', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: 'No.' }) }),
    );

    expect(await fetchImportLibraries('source')).toEqual({
      kind: 'refused',
      refusal: { message: 'No.' },
    });
  });
});
