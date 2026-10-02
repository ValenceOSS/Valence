import { describe, expect, it } from 'vitest';
import { aCalendarEntry } from '@ValenceClient/testing/aCalendarEntry';
import { filterCalendar } from './filterCalendar';

const FILM = aCalendarEntry({ id: 'film', episode: null, source: 'request' });
const HELD = aCalendarEntry({ id: 'held' });
const BOTH = aCalendarEntry({ id: 'both', requestedBy: { id: 'account-1', name: 'Sam' } });

const idsOf = (filter: Parameters<typeof filterCalendar>[1]) =>
  filterCalendar([FILM, HELD, BOTH], filter).map((entry) => entry.id);

describe('filterCalendar', () => {
  it('keeps everything unless told otherwise', () => {
    expect(filterCalendar([FILM, HELD, BOTH]).map((entry) => entry.id)).toEqual([
      'film',
      'held',
      'both',
    ]);
  });

  it('keeps films or shows', () => {
    expect(idsOf({ kinds: 'films', from: 'all' })).toEqual(['film']);
    expect(idsOf({ kinds: 'shows', from: 'all' })).toEqual(['held', 'both']);
  });

  it('keeps what the library holds or what was asked for, an episode that is both in either', () => {
    expect(idsOf({ kinds: 'all', from: 'library' })).toEqual(['held', 'both']);
    expect(idsOf({ kinds: 'all', from: 'requests' })).toEqual(['film', 'both']);
  });
});
