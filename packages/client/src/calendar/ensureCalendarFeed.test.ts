import { afterEach, describe, expect, it, vi } from 'vitest';
import { ensureCalendarFeed } from './ensureCalendarFeed';

const FEED = { token: 'a-token', createdAt: '2026-10-02T10:00:00.000Z', lastReadAt: null };

describe('ensureCalendarFeed', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('answers the link', async () => {
    const fetching = vi.fn(() => Promise.resolve(Response.json(FEED)));

    vi.stubGlobal('fetch', fetching);

    await expect(ensureCalendarFeed()).resolves.toEqual(FEED);
    expect(fetching).toHaveBeenCalledWith(
      '/api/calendar/feed',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('answers nothing where the server refuses or cannot be reached', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(Response.json({}, { status: 401 })));
    await expect(ensureCalendarFeed()).resolves.toBeNull();

    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')));
    await expect(ensureCalendarFeed()).resolves.toBeNull();
  });
});
