import { describe, expect, it } from 'vitest';
import { describeBrowsing } from './describeBrowsing';

describe('describeBrowsing', () => {
  it('names the list, and the studio where one was chosen', () => {
    expect(describeBrowsing({ kind: 'film', list: 'trending', studio: null })).toBe(
      'Trending films',
    );
    expect(describeBrowsing({ kind: 'series', list: 'upcoming', studio: null })).toBe(
      'Coming series',
    );
    expect(
      describeBrowsing({ kind: 'film', list: 'popular', studio: '2' }, 'Walt Disney Pictures'),
    ).toBe('Walt Disney Pictures films');
  });

  it('still names a studio nobody could name', () => {
    expect(describeBrowsing({ kind: 'film', list: 'popular', studio: '2' })).toBe('Studio films');
  });
});
