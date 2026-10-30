import { describe, expect, it } from 'vitest';
import { backdropOfCalendarEntry } from './backdropOfCalendarEntry';
import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

const ENTRY: CalendarEntry = {
  id: 'film:1:digital',
  date: '2026-10-09',
  release: 'digital',
  title: 'A film',
  episode: null,
  artworkMediaId: null,
  posterUrl: 'https://image.example/poster.jpg',
  backdropUrl: 'https://image.example/backdrop.jpg',
  logoUrl: null,
  state: 'wanted',
  source: 'request',
  requestedBy: null,
  opens: { kind: 'asking', requestKind: 'film', catalogueId: '1' },
};

describe('backdropOfCalendarEntry', () => {
  it("takes the library's own backdrop where the library holds it", () => {
    expect(backdropOfCalendarEntry({ ...ENTRY, artworkMediaId: 'media-1' })).toBe(
      '/api/media/media-1/image/backdrop?of=title',
    );
  });

  it("asks for the library's own backdrop at the size it is drawn", () => {
    expect(backdropOfCalendarEntry({ ...ENTRY, artworkMediaId: 'media-1' }, 'medium')).toBe(
      '/api/media/media-1/image/backdrop?of=title&size=medium',
    );
  });

  it("takes the catalogue's backdrop where it was only asked for", () => {
    expect(backdropOfCalendarEntry(ENTRY)).toBe('https://image.example/backdrop.jpg');
  });

  it("falls back to the catalogue's poster where it has no backdrop", () => {
    expect(backdropOfCalendarEntry({ ...ENTRY, backdropUrl: null })).toBe(
      'https://image.example/poster.jpg',
    );
  });

  it('has nothing where the catalogue has neither', () => {
    expect(backdropOfCalendarEntry({ ...ENTRY, backdropUrl: null, posterUrl: null })).toBeNull();
  });
});
