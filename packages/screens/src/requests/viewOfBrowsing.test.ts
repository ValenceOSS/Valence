import { describe, expect, it } from 'vitest';
import { readBrowsing } from './readBrowsing';
import { viewOfBrowsing } from './viewOfBrowsing';

describe('viewOfBrowsing', () => {
  it('writes what the address carries, and reads back as it was written', () => {
    expect(viewOfBrowsing({ kind: 'film', list: 'trending', studio: null })).toBe('film:trending');
    expect(viewOfBrowsing({ kind: 'series', list: 'popular', studio: '2' })).toBe(
      'series:popular:2',
    );

    const browsing = { kind: 'film', list: 'upcoming', studio: '420' } as const;

    expect(readBrowsing(viewOfBrowsing(browsing))).toEqual(browsing);
  });
});
