import { describe, expect, it } from 'vitest';
import { seasonsChosen } from './seasonsChosen';

const EPISODES = [{ season: 2 }, { season: 0 }, { season: 1 }, { season: 2 }];

describe('seasonsChosen', () => {
  it('keeps every season where new ones are followed', () => {
    expect(seasonsChosen(null, true, EPISODES)).toBeNull();
  });

  it('names each regular season there is where new ones are not followed', () => {
    expect(seasonsChosen(null, false, EPISODES)).toEqual([1, 2]);
  });

  it('keeps every season where the catalogue lists nothing to name', () => {
    expect(seasonsChosen(null, false, [])).toBeNull();
  });

  it('keeps seasons already named', () => {
    expect(seasonsChosen([0, 2], false, EPISODES)).toEqual([0, 2]);
  });
});
