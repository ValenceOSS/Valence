import { afterEach, describe, expect, it, vi } from 'vitest';
import { connectImportSource } from './connectImportSource';

afterEach(() => {
  vi.unstubAllGlobals();
});

const ANSWER = {
  id: 'source',
  kind: 'jellyfin',
  name: 'Den',
  url: 'http://den',
  version: '12.1.0',
  createdAt: '2026-10-02T00:00:00.000Z',
};

describe('connectImportSource', () => {
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

    expect(await connectImportSource({ kind: 'jellyfin', url: 'http://den', token: 'k' })).toEqual({
      kind: 'answered',
      value: ANSWER,
    });

    const [path, init] = fetchMock.mock.calls[0] ?? ['', { method: '' }];

    expect(path).toBe('/api/admin/imports');
    expect(init).toMatchObject({ method: 'POST', credentials: 'same-origin' });
    expect(JSON.parse(init.body ?? '')).toEqual({
      kind: 'jellyfin',
      url: 'http://den',
      token: 'k',
    });
  });

  it('passes on the server’s refusal', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: 'No.' }) }),
    );

    expect(await connectImportSource({ kind: 'jellyfin', url: 'http://den', token: 'k' })).toEqual({
      kind: 'refused',
      refusal: { message: 'No.' },
    });
  });
});
