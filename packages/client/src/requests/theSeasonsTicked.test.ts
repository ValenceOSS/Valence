import { describe, expect, it } from 'vitest';
import { theSeasonsTicked } from './theSeasonsTicked';
import type { CatalogueSeason } from '@ValenceContracts/schemas/MediaRequest';

const aSeason = (
  season: number,
  standing: CatalogueSeason['standing'] = 'askable',
): CatalogueSeason => ({
  season,
  episodeCount: 10,
  firstAired: null,
  standing,
});

describe('theSeasonsTicked', () => {
  it('ticks every season there is where every season is asked for', () => {
    expect(theSeasonsTicked(null, [aSeason(1), aSeason(2)])).toEqual([1, 2]);
  });

  it('ticks only the ones asked for otherwise', () => {
    expect(theSeasonsTicked([2], [aSeason(1), aSeason(2)])).toEqual([2]);
  });

  it('leaves out of every season the ones the library holds whole', () => {
    expect(theSeasonsTicked(null, [aSeason(1, 'library'), aSeason(2, 'partly')])).toEqual([2]);
  });
});
