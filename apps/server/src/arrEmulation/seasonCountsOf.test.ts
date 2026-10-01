import { describe, expect, it } from 'vitest';
import { seasonCountsOf } from './seasonCountsOf';

describe('seasonCountsOf', () => {
  it('counts the episodes of each season', () => {
    expect(seasonCountsOf([{ season: 1 }, { season: 1 }, { season: 2 }])).toEqual(
      new Map([
        [1, 2],
        [2, 1],
      ]),
    );
  });

  it('leaves out an episode that names no season', () => {
    expect(seasonCountsOf([{ season: null }])).toEqual(new Map());
  });
});
