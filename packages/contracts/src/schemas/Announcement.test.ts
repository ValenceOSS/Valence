import { describe, expect, it } from 'vitest';
import { AnnouncementDraftSchema, AnnouncementSchema } from './Announcement';

describe('AnnouncementDraftSchema', () => {
  it('reads an announcement as information that never ends, unless told otherwise', () => {
    expect(AnnouncementDraftSchema.parse({ text: 'Back at six' })).toEqual({
      text: 'Back at six',
      severity: 'info',
      endsAt: null,
    });
  });

  it('refuses an empty announcement, or one of a severity it does not know', () => {
    expect(AnnouncementDraftSchema.safeParse({ text: ' ' }).success).toBe(false);
    expect(AnnouncementDraftSchema.safeParse({ text: 'Hi', severity: 'loud' }).success).toBe(false);
  });
});

describe('AnnouncementSchema', () => {
  it('carries what was posted, and when', () => {
    expect(
      AnnouncementSchema.parse({
        id: 'a',
        text: 'Down for an update at ten',
        severity: 'warning',
        endsAt: '2026-10-16T22:00:00.000Z',
        postedAt: '2026-10-15T09:00:00.000Z',
      }).severity,
    ).toBe('warning');
  });
});
