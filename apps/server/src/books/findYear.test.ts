import { describe, expect, it } from 'vitest';
import { findYear } from './findYear';

describe('findYear', () => {
  it('prefers a bracketed year to a bare one', () => {
    expect(findYear('Dune 1965 (2005 edition)')?.year).toBe(2005);
  });

  it('takes the last bare year where none is bracketed', () => {
    expect(findYear('Dune 1965')).toEqual({ year: 1965, index: 5 });
  });

  it('reads nothing where the name gives no year', () => {
    expect(findYear('Dune')).toBeNull();
  });
});
