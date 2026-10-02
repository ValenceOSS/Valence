import { describe, expect, it } from 'vitest';
import { readCalendarFilters } from './readCalendarFilters';

describe('readCalendarFilters', () => {
  it('keeps everything, and the viewer’s own requests, where nothing is chosen', () => {
    expect(readCalendarFilters(new Set(), true)).toEqual({
      filter: { kinds: 'all', from: 'all' },
      who: 'mine',
    });
  });

  it('reads each choice', () => {
    expect(
      readCalendarFilters(new Set(['kind:shows', 'from:requests', 'who:everyone']), true),
    ).toEqual({ filter: { kinds: 'shows', from: 'requests' }, who: 'everyone' });
  });

  it('reads only the viewer’s own requests for somebody who may not see everybody’s', () => {
    expect(readCalendarFilters(new Set(['who:everyone']), false).who).toBe('mine');
  });
});
