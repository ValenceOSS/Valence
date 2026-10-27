import { afterEach, describe, expect, it, vi } from 'vitest';
import { beginReadiedSession } from './beginReadiedSession';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('beginReadiedSession', () => {
  it('tells the server the session has begun, naming the device', async () => {
    const fetching = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));

    vi.stubGlobal('fetch', fetching);

    await expect(beginReadiedSession('s-1', 'tab 1')).resolves.toBe(true);
    expect(fetching).toHaveBeenCalledWith('/api/playback/session/s-1/begin?clientId=tab%201', {
      method: 'POST',
    });
  });

  it('says so where the server did not know the session', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(null, { status: 404 })));

    await expect(beginReadiedSession('s-1')).resolves.toBe(false);
  });

  it('says so where the server could not be reached', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')));

    await expect(beginReadiedSession('s-1')).resolves.toBe(false);
  });
});
