import { describe, expect, it } from 'vitest';
import { tickEverySeason } from './tickEverySeason';
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

const LISTED = [aSeason(0), aSeason(1, 'library'), aSeason(2), aSeason(3)];

describe('tickEverySeason', () => {
  it('ticks every season where Specials are not ticked', () => {
    expect(tickEverySeason([2], LISTED, true)).toBeNull();
  });

  it('ticks every regular season not held beside Specials where they are ticked', () => {
    expect(tickEverySeason([0], LISTED, true)).toEqual([0, 2, 3]);
  });

  it('unticks every regular season, leaving Specials as they were', () => {
    expect(tickEverySeason(null, LISTED, false)).toEqual([]);
    expect(tickEverySeason([0, 2], LISTED, false)).toEqual([0]);
  });
});
