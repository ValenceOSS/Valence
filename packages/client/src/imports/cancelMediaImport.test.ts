import { afterEach, describe, expect, it, vi } from 'vitest';
import { cancelMediaImport } from './cancelMediaImport';

afterEach(() => {
  vi.unstubAllGlobals();
});

const ANSWER = {
  id: 'run',
  sourceId: 'source',
  state: 'planning',
  report: null,
  failure: null,
  progress: null,
  createdAt: '2026-10-02T00:00:00.000Z',
  startedAt: null,
  finishedAt: null,
};

describe('cancelMediaImport', () => {
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

    expect(await cancelMediaImport('run')).toEqual({ kind: 'answered', value: ANSWER });

    const [path, init] = fetchMock.mock.calls[0] ?? ['', { method: '' }];

    expect(path).toBe('/api/admin/imports/runs/run/cancel');
    expect(init).toMatchObject({ method: 'POST', credentials: 'same-origin' });
  });

  it('passes on the server’s refusal', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: 'No.' }) }),
    );

    expect(await cancelMediaImport('run')).toEqual({
      kind: 'refused',
      refusal: { message: 'No.' },
    });
  });
});
