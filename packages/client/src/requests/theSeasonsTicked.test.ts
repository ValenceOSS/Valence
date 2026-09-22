import { describe, expect, it } from 'vitest';
import { theSeasonsTicked } from './theSeasonsTicked';
import type { CatalogueSeason } from '@ValenceContracts/schemas/MediaRequest';

const aSeason = (season: number): CatalogueSeason => ({
  season,
  episodeCount: 10,
  firstAired: null,
  standing: 'askable',
});

describe('theSeasonsTicked', () => {
  it('ticks every season there is where every season is asked for', () => {
    expect(theSeasonsTicked(null, [aSeason(1), aSeason(2)])).toEqual([1, 2]);
  });

  it('ticks only the ones asked for otherwise', () => {
    expect(theSeasonsTicked([2], [aSeason(1), aSeason(2)])).toEqual([2]);
  });
});
