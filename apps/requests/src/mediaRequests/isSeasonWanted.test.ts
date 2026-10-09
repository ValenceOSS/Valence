import { describe, expect, it } from 'vitest';
import { isSeasonWanted } from './isSeasonWanted';

const NAMED = { seasons: [1, 2], followsNewSeasons: false, followsAfter: 4 };

describe('isSeasonWanted', () => {
  it('wants every regular season where none were named, but not Specials', () => {
    const every = { ...NAMED, seasons: null };

    expect(isSeasonWanted(every, 7)).toBe(true);
    expect(isSeasonWanted(every, 0)).toBe(false);
  });

  it('wants only the seasons named where it does not follow new ones', () => {
    expect(isSeasonWanted(NAMED, 2)).toBe(true);
    expect(isSeasonWanted(NAMED, 3)).toBe(false);
    expect(isSeasonWanted(NAMED, 5)).toBe(false);
  });

  it('wants seasons after the last one there was where it follows new ones', () => {
    const following = { ...NAMED, followsNewSeasons: true };

    expect(isSeasonWanted(following, 3)).toBe(false);
    expect(isSeasonWanted(following, 5)).toBe(true);
  });

  it('wants Specials only where they were named, whether or not it follows new seasons', () => {
    expect(isSeasonWanted({ ...NAMED, followsNewSeasons: true }, 0)).toBe(false);
    expect(isSeasonWanted({ ...NAMED, seasons: [0, 1] }, 0)).toBe(true);
  });

  it('wants nothing new until it knows the last season there was', () => {
    expect(isSeasonWanted({ ...NAMED, followsNewSeasons: true, followsAfter: null }, 9)).toBe(
      false,
    );
  });
});
