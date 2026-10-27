import { describe, expect, it } from 'vitest';
import { readGenres } from './readGenres';

describe('reading the genres off a stored row', () => {
  it('reads a list of names', () => {
    expect(readGenres(['Drama', 'Crime'])).toEqual(['Drama', 'Crime']);
  });

  it('reads anything else as no genres rather than failing', () => {
    expect(readGenres(null)).toBeNull();
    expect(readGenres([1, 2])).toBeNull();
    expect(readGenres({ genres: ['Drama'] })).toBeNull();
  });
});
