import { describe, expect, it } from 'vitest';
import { aCalendarEntry } from '@ValenceClient/testing/aCalendarEntry';
import { groupCalendarByDay } from './groupCalendarByDay';

describe('groupCalendarByDay', () => {
  it('gathers entries under their days, the days in order', () => {
    const grouped = groupCalendarByDay([
      aCalendarEntry({ id: 'b', date: '2026-10-09' }),
      aCalendarEntry({ id: 'a', date: '2026-10-08' }),
      aCalendarEntry({ id: 'c', date: '2026-10-09' }),
    ]);

    expect(grouped.map((day) => [day.date, day.entries.map((entry) => entry.id)])).toEqual([
      ['2026-10-08', ['a']],
      ['2026-10-09', ['b', 'c']],
    ]);
  });

  it('has nothing to group where nothing is coming', () => {
    expect(groupCalendarByDay([])).toEqual([]);
  });
});
