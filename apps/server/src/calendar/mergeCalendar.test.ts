import { describe, expect, it } from 'vitest';
import { mergeCalendar } from './mergeCalendar';
import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

const anEntry = (change: Partial<CalendarEntry>): CalendarEntry => ({
  id: 'tv:300:s2e5',
  date: '2026-10-08',
  release: 'airs',
  title: 'A Show',
  episode: { seasonNumber: 2, episodeNumber: 5, title: 'Fifth', stillUrl: null },
  artworkMediaId: 'cover-1',
  posterUrl: null,
  backdropUrl: null,
  logoUrl: null,
  state: 'notHeld',
  source: 'library',
  requestedBy: null,
  opens: { kind: 'show', showId: 'series-1' },
  ...change,
});

const ASKED = anEntry({
  artworkMediaId: null,
  posterUrl: 'https://image.example/poster.jpg',
  state: 'downloading',
  source: 'request',
  requestedBy: { id: 'account-1', name: 'Sam' },
  opens: { kind: 'asking', requestKind: 'series', catalogueId: '300' },
});

describe('mergeCalendar', () => {
  it('shows an episode both held and requested once, as the library has it', () => {
    const merged = mergeCalendar([anEntry({})], [ASKED]);

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      source: 'library',
      artworkMediaId: 'cover-1',
      opens: { kind: 'show', showId: 'series-1' },
      state: 'downloading',
      requestedBy: { id: 'account-1', name: 'Sam' },
    });
  });

  it('keeps an episode on disk available, whatever the request says', () => {
    expect(mergeCalendar([anEntry({ state: 'available' })], [ASKED])[0]?.state).toBe('available');
  });

  it('keeps what only a request knows, and puts everything in the order the days fall', () => {
    const merged = mergeCalendar(
      [anEntry({ date: '2026-10-09', id: 'tv:300:s2e6' })],
      [
        anEntry({
          ...ASKED,
          id: 'film:100:cinema',
          date: '2026-10-03',
          title: 'A Film',
          episode: null,
        }),
        anEntry({
          ...ASKED,
          id: 'film:100:cinema',
          date: '2026-10-03',
          title: 'A Film',
          episode: null,
        }),
      ],
    );

    expect(merged.map((entry) => entry.id)).toEqual(['film:100:cinema', 'tv:300:s2e6']);
  });
});
