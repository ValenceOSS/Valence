import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

/**
 * An episode of a show in the library on the release calendar, airing next week and not out yet,
 * unless told otherwise.
 *
 * @param change - What is different about this one.
 * @returns The entry.
 */
const aCalendarEntry = (change: Partial<CalendarEntry> = {}): CalendarEntry => ({
  id: 'tv:300:s2e5',
  date: '2026-10-08',
  release: 'airs',
  title: 'A Show',
  episode: { seasonNumber: 2, episodeNumber: 5, title: 'Fifth', stillUrl: null },
  artworkMediaId: '2b2d4f6e-1a3c-4e5f-8a7b-0c1d2e3f4a5b',
  posterUrl: null,
  backdropUrl: null,
  logoUrl: null,
  state: 'notOutYet',
  source: 'library',
  requestedBy: null,
  opens: { kind: 'show', showId: 'series-1' },
  ...change,
});

export { aCalendarEntry };
