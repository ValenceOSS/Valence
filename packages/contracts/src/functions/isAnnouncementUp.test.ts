import { describe, expect, it } from 'vitest';
import { isAnnouncementUp } from './isAnnouncementUp';

const announcement = (endsAt: string | null) => ({
  id: 'a',
  text: 'Back at six',
  severity: 'info' as const,
  endsAt,
  postedAt: '2026-10-15T09:00:00.000Z',
});

describe('isAnnouncementUp', () => {
  it('keeps an announcement with no end up', () => {
    expect(isAnnouncementUp(announcement(null), Date.parse('2030-01-01T00:00:00Z'))).toBe(true);
  });

  it('keeps an announcement up until it ends, and takes it down after', () => {
    const ends = '2026-10-16T00:00:00.000Z';

    expect(isAnnouncementUp(announcement(ends), Date.parse('2026-10-15T23:59:00Z'))).toBe(true);
    expect(isAnnouncementUp(announcement(ends), Date.parse('2026-10-16T00:01:00Z'))).toBe(false);
  });
});
