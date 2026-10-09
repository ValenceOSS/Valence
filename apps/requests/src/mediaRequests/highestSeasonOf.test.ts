import { describe, expect, it } from 'vitest';
import { highestSeasonOf } from './highestSeasonOf';

describe('highestSeasonOf', () => {
  it('finds the last regular season, leaving out specials', () => {
    expect(highestSeasonOf([{ season: 0 }, { season: 3 }, { season: 1 }])).toBe(3);
  });

  it('is nothing where there is no regular season', () => {
    expect(highestSeasonOf([{ season: 0 }])).toBeNull();
    expect(highestSeasonOf([])).toBeNull();
  });
});
