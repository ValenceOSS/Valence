import { describe, expect, it } from 'vitest';
import { posterOfCalendarEntry } from './posterOfCalendarEntry';
import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

const ENTRY: CalendarEntry = {
  id: 'film:1:digital',
  date: '2026-10-09',
  release: 'digital',
  title: 'A film',
  episode: null,
  artworkMediaId: null,
  posterUrl: 'https://image.example/poster.jpg',
  backdropUrl: null,
  logoUrl: null,
  state: 'wanted',
  source: 'request',
  requestedBy: null,
  opens: { kind: 'asking', requestKind: 'film', catalogueId: '1' },
};

describe('posterOfCalendarEntry', () => {
  it("takes the library's own poster where the library holds it", () => {
    expect(posterOfCalendarEntry({ ...ENTRY, artworkMediaId: 'media-1' })).toContain(
      '/api/media/media-1/image/poster',
    );
  });

  it("takes the catalogue's poster where it was only asked for", () => {
    expect(posterOfCalendarEntry(ENTRY)).toBe('https://image.example/poster.jpg');
  });

  it('has none where neither has one', () => {
    expect(posterOfCalendarEntry({ ...ENTRY, posterUrl: null })).toBeNull();
  });
});
