import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendTitleWork } from './sendTitleWork';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sendTitleWork', () => {
  it('says how much it reached and the job doing it', async () => {
    const fetched = vi.fn((_address: string, _init?: RequestInit) =>
      Promise.resolve(new Response(JSON.stringify({ corrected: 3, jobId: 'job' }))),
    );

    vi.stubGlobal('fetch', fetched);

    await expect(sendTitleWork('/api/media/a/refresh', { mode: 'details' })).resolves.toEqual({
      kind: 'reached',
      count: 3,
      jobId: 'job',
    });
    expect(fetched.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ mode: 'details' }),
    });
  });

  it('says why it was refused, or that the server could not be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ error: 'No such item', code: 'x', values: {} }), {
            status: 404,
          }),
        ),
      ),
    );

    await expect(sendTitleWork('/api/media/a/unmatch')).resolves.toEqual({
      kind: 'refused',
      reason: 'No such item',
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );

    await expect(sendTitleWork('/api/media/a/unmatch')).resolves.toMatchObject({
      kind: 'refused',
    });
  });
});
