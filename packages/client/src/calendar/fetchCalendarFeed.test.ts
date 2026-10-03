import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchCalendarFeed } from './fetchCalendarFeed';

describe('fetchCalendarFeed', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the link the person has, or that they have none', async () => {
    const feed = { token: 'a-token', createdAt: '2026-10-02T10:00:00.000Z', lastReadAt: null };

    vi.stubGlobal('fetch', () => Promise.resolve(Response.json({ feed })));
    await expect(fetchCalendarFeed()).resolves.toEqual(feed);

    vi.stubGlobal('fetch', () => Promise.resolve(Response.json({ feed: null })));
    await expect(fetchCalendarFeed()).resolves.toBeNull();
  });
});
