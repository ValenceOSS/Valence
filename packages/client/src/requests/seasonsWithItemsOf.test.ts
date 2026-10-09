import { describe, expect, it } from 'vitest';
import { seasonsWithItemsOf } from './seasonsWithItemsOf';

describe('seasonsWithItemsOf', () => {
  it('lists each season with something waited for once, in order', () => {
    expect(
      seasonsWithItemsOf([{ season: 2 }, { season: 1 }, { season: 2 }, { season: null }]),
    ).toEqual([1, 2]);
  });
});
