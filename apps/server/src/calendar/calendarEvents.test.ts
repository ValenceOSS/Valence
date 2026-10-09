import { describe, expect, it } from 'vitest';
import { calendarEvents } from './calendarEvents';
import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

const EPISODE: CalendarEntry = {
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

const FILM: CalendarEntry = {
  ...EPISODE,
  id: 'film:100:cinema',
  release: 'cinema',
  title: 'A Film',
  episode: null,
  state: 'wanted',
  source: 'request',
  requestedBy: { id: 'ada', name: 'Ada' },
  opens: { kind: 'asking', requestKind: 'film', catalogueId: '100' },
};

describe('calendarEvents', () => {
  it('titles an episode by its show, its number and its own name', () => {
    expect(calendarEvents([EPISODE], 'https://valence.example')).toEqual([
      {
        uid: 'tv:300:s2e5@valence',
        date: '2026-10-08',
        summary: 'A Show · S2 E5 · Fifth',
        description: 'Not out yet',
        url: 'https://valence.example/calendar?on=2026-10-08',
      },
    ]);
  });

  it('titles each of a film’s releases, and says who asked for it', () => {
    const [cinema, digital, disc] = calendarEvents(
      [
        FILM,
        { ...FILM, id: 'film:100:digital', release: 'digital' },
        { ...FILM, id: 'film:100:physical', release: 'physical', state: 'available' },
      ],
      'https://valence.example',
    );

    expect(cinema?.summary).toBe('A Film in cinemas');
    expect(cinema?.description).toBe('Missing\nRequested by Ada');
    expect(digital?.summary).toBe('A Film to buy or rent');
    expect(disc?.summary).toBe('A Film on disc');
    expect(disc?.description).toBe('In the library\nRequested by Ada');
  });

  it('says when an episode has aired but nobody has it', () => {
    expect(calendarEvents([{ ...EPISODE, state: 'notHeld' }], '')[0]?.description).toBe(
      'Not in the library',
    );
  });
});
