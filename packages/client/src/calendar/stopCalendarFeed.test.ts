import { afterEach, describe, expect, it, vi } from 'vitest';
import { stopCalendarFeed } from './stopCalendarFeed';

describe('stopCalendarFeed', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('says whether the link was turned off', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(null, { status: 204 })));
    await expect(stopCalendarFeed()).resolves.toBe(true);

    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')));
    await expect(stopCalendarFeed()).resolves.toBe(false);
  });
});
