import { afterEach, describe, expect, it, vi } from 'vitest';
import { givePlexPin } from './givePlexPin';

afterEach(() => {
  vi.unstubAllGlobals();
});

const ANSWER = { done: true };

describe('givePlexPin', () => {
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

    expect(await givePlexPin('source', { userId: 'u', pin: '1234' })).toEqual({
      kind: 'answered',
      value: ANSWER,
    });

    const [path, init] = fetchMock.mock.calls[0] ?? ['', { method: '' }];

    expect(path).toBe('/api/admin/imports/source/pins');
    expect(init).toMatchObject({ method: 'POST', credentials: 'same-origin' });
    expect(JSON.parse(init.body ?? '')).toEqual({ userId: 'u', pin: '1234' });
  });

  it('passes on the server’s refusal', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: 'No.' }) }),
    );

    expect(await givePlexPin('source', { userId: 'u', pin: '1234' })).toEqual({
      kind: 'refused',
      refusal: { message: 'No.' },
    });
  });
});
