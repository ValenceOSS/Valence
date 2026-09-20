import { describe, expect, it } from 'vitest';
import { readBrowsing } from './readBrowsing';

describe('readBrowsing', () => {
  it('reads the kind, the list and the studio out of what the address carries', () => {
    expect(readBrowsing('film:trending')).toEqual({
      kind: 'film',
      list: 'trending',
      studio: null,
    });
    expect(readBrowsing('series:upcoming')).toEqual({
      kind: 'series',
      list: 'upcoming',
      studio: null,
    });
    expect(readBrowsing('film:popular:2')).toEqual({ kind: 'film', list: 'popular', studio: '2' });
  });

  it('says nothing where the address names something else', () => {
    expect(readBrowsing(null)).toBeNull();
    expect(readBrowsing('mine')).toBeNull();
    expect(readBrowsing('album:popular')).toBeNull();
    expect(readBrowsing('film:best')).toBeNull();
  });
});
