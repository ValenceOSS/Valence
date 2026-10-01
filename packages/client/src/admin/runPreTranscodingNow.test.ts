import { afterEach, describe, expect, it, vi } from 'vitest';
import { runPreTranscodingNow } from './runPreTranscodingNow';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('runPreTranscodingNow', () => {
  it('says whether a copy is now being made', async () => {
    const fetching = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ queued: true }), { status: 202 }));

    vi.stubGlobal('fetch', fetching);

    await expect(runPreTranscodingNow()).resolves.toBe(true);
    expect(fetching).toHaveBeenCalledWith(
      '/api/pre-transcoding/run',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('says no where the server refused', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 403 })));

    await expect(runPreTranscodingNow()).resolves.toBe(false);
  });
});
