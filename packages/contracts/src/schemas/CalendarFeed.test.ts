import { describe, expect, it } from 'vitest';
import { CalendarFeedSchema, CalendarFeedStatusSchema } from './CalendarFeed';

const FEED = { token: 'a-token', createdAt: '2026-10-02T10:00:00.000Z', lastReadAt: null };

describe('CalendarFeedStatusSchema', () => {
  it('reads a link that is on, and that there is none', () => {
    expect(CalendarFeedStatusSchema.parse({ feed: FEED }).feed?.token).toBe('a-token');
    expect(CalendarFeedStatusSchema.parse({ feed: null }).feed).toBeNull();
  });
});

describe('CalendarFeedSchema', () => {
  it('reads a link whose token can no longer be opened as having none', () => {
    expect(CalendarFeedSchema.parse({ ...FEED, token: null }).token).toBeNull();
    expect(CalendarFeedSchema.safeParse({ ...FEED, token: '' }).success).toBe(false);
  });
});
