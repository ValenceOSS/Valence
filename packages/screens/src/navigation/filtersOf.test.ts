import { describe, expect, it } from 'vitest';
import { filtersOf } from './filtersOf';

describe('filtersOf', () => {
  it('reads every filter the address listed', () => {
    expect(filtersOf({ genre: null, filters: 'genre:Drama,decade:1990,rating:7' })).toEqual(
      new Set(['genre:Drama', 'decade:1990', 'rating:7']),
    );
  });

  it('counts the single genre a link from elsewhere still carries', () => {
    expect(filtersOf({ genre: 'Comedy', filters: 'decade:2000' })).toEqual(
      new Set(['decade:2000', 'genre:Comedy']),
    );
  });

  it('chooses nothing where the address chose nothing, or nothing it can read', () => {
    expect(filtersOf({ genre: null, filters: null })).toEqual(new Set());
    expect(filtersOf({ genre: null, filters: 'banana,' })).toEqual(new Set());
  });
});
