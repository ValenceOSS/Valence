import { describe, expect, it } from 'vitest';
import { nameOfSeason } from './nameOfSeason';

describe('nameOfSeason', () => {
  it('numbers a season, calls season nought the specials, and an unnumbered one episodes', () => {
    expect(nameOfSeason(3)).toBe('Season 3');
    expect(nameOfSeason(0)).toBe('Specials');
    expect(nameOfSeason(null)).toBe('Episodes');
  });
});
