import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeImportSetupLinks } from './makeImportSetupLinks';

afterEach(() => {
  vi.unstubAllGlobals();
});

const ANSWER = {
  canEmail: true,
  links: [
    {
      userId: 'u',
      name: 'U',
      url: 'http://valence/setup/x',
      expiresAt: '2026-11-01T00:00:00.000Z',
      hasEmail: false,
    },
  ],
};

describe('makeImportSetupLinks', () => {
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

    expect(await makeImportSetupLinks('run', 30)).toEqual({ kind: 'answered', value: ANSWER });

    const [path, init] = fetchMock.mock.calls[0] ?? ['', { method: '' }];

    expect(path).toBe('/api/admin/imports/runs/run/setup-links');
    expect(init).toMatchObject({ method: 'POST', credentials: 'same-origin' });
    expect(JSON.parse(init.body ?? '')).toEqual({ lifetimeDays: 30 });
  });

  it('passes on the server’s refusal', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: 'No.' }) }),
    );

    expect(await makeImportSetupLinks('run', 30)).toEqual({
      kind: 'refused',
      refusal: { message: 'No.' },
    });
  });
});
