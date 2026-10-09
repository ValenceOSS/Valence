import { describe, expect, it } from 'vitest';
import { rebaseSeasons } from './rebaseSeasons';

const SIX = [0, 1, 2, 3, 4, 5, 6].map((season) => ({ season }));

describe('rebaseSeasons', () => {
  it('names the new seasons a request picked up, and moves on the last season there was', () => {
    expect(
      rebaseSeasons({ seasons: [1, 2], followsNewSeasons: true, followsAfter: 4 }, SIX),
    ).toEqual({ seasons: [1, 2, 5, 6], followsNewSeasons: true, followsAfter: 6 });
  });

  it('names every regular season for a request that wanted every one, and follows new ones', () => {
    expect(
      rebaseSeasons({ seasons: null, followsNewSeasons: false, followsAfter: null }, SIX),
    ).toEqual({ seasons: [1, 2, 3, 4, 5, 6], followsNewSeasons: true, followsAfter: 6 });
  });

  it('keeps Specials where they were named', () => {
    expect(
      rebaseSeasons({ seasons: [0, 3], followsNewSeasons: false, followsAfter: 6 }, SIX).seasons,
    ).toEqual([0, 3]);
  });

  it('changes nothing where the catalogue lists no seasons', () => {
    const choice = { seasons: null, followsNewSeasons: false, followsAfter: null };

    expect(rebaseSeasons(choice, [])).toBe(choice);
  });
});
