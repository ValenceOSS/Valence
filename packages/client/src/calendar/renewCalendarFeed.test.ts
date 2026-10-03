import { afterEach, describe, expect, it, vi } from 'vitest';
import { renewCalendarFeed } from './renewCalendarFeed';

const FEED = { token: 'a-token', createdAt: '2026-10-02T10:00:00.000Z', lastReadAt: null };

describe('renewCalendarFeed', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('answers the link', async () => {
    const fetching = vi.fn(() => Promise.resolve(Response.json(FEED)));

    vi.stubGlobal('fetch', fetching);

    await expect(renewCalendarFeed()).resolves.toEqual(FEED);
    expect(fetching).toHaveBeenCalledWith(
      '/api/calendar/feed/renew',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('answers nothing where the server refuses or cannot be reached', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(Response.json({}, { status: 401 })));
    await expect(renewCalendarFeed()).resolves.toBeNull();

    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')));
    await expect(renewCalendarFeed()).resolves.toBeNull();
  });
});
