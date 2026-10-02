import { describe, expect, it } from 'vitest';
import { CalendarEntrySchema, ReleaseCalendarQuerySchema } from './ReleaseCalendar';

const ENTRY = {
  id: 'tv:300:s2e5',
  date: '2026-10-08',
  release: 'airs',
  title: 'A Show',
  episode: { seasonNumber: 2, episodeNumber: 5, title: 'Fifth', stillUrl: null },
  artworkMediaId: null,
  posterUrl: null,
  backdropUrl: null,
  logoUrl: null,
  state: 'notOutYet',
  source: 'library',
  requestedBy: null,
  opens: { kind: 'show', showId: 'series-1' },
};

describe('CalendarEntrySchema', () => {
  it('reads an episode on the day it airs', () => {
    expect(CalendarEntrySchema.parse(ENTRY).episode?.title).toBe('Fifth');
  });

  it('refuses a state or a release it does not know', () => {
    expect(CalendarEntrySchema.safeParse({ ...ENTRY, state: 'lost' }).success).toBe(false);
    expect(CalendarEntrySchema.safeParse({ ...ENTRY, release: 'streaming' }).success).toBe(false);
  });

  it('opens a request by its kind and its id in the catalogue', () => {
    expect(
      CalendarEntrySchema.safeParse({
        ...ENTRY,
        opens: { kind: 'asking', requestKind: 'film', catalogueId: '100' },
      }).success,
    ).toBe(true);
    expect(
      CalendarEntrySchema.safeParse({ ...ENTRY, opens: { kind: 'asking', catalogueId: '100' } })
        .success,
    ).toBe(false);
  });
});

describe('ReleaseCalendarQuerySchema', () => {
  it('asks for the viewer’s own requests unless everybody’s are asked for', () => {
    expect(ReleaseCalendarQuerySchema.parse({ from: '2026-10-01', to: '2026-10-31' }).who).toBe(
      'mine',
    );
  });

  it('refuses days that run backwards', () => {
    expect(
      ReleaseCalendarQuerySchema.safeParse({ from: '2026-10-31', to: '2026-10-01' }).success,
    ).toBe(false);
  });

  it('refuses more days than the calendar ever shows at once', () => {
    expect(
      ReleaseCalendarQuerySchema.safeParse({ from: '2026-01-01', to: '2026-12-31' }).success,
    ).toBe(false);
    expect(
      ReleaseCalendarQuerySchema.safeParse({ from: '2026-10-01', to: '2027-01-28' }).success,
    ).toBe(true);
  });
});
