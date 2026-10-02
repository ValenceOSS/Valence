import { afterEach, describe, expect, it, vi } from 'vitest';
import { forgetImportSource } from './forgetImportSource';

afterEach(() => {
  vi.unstubAllGlobals();
});

const ANSWER = { done: true };

describe('forgetImportSource', () => {
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

    expect(await forgetImportSource('a source')).toEqual({ kind: 'answered', value: ANSWER });

    const [path, init] = fetchMock.mock.calls[0] ?? ['', { method: '' }];

    expect(path).toBe('/api/admin/imports/a%20source');
    expect(init).toMatchObject({ method: 'DELETE', credentials: 'same-origin' });
  });

  it('passes on the server’s refusal', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: 'No.' }) }),
    );

    expect(await forgetImportSource('a source')).toEqual({
      kind: 'refused',
      refusal: { message: 'No.' },
    });
  });
});
