import { describe, expect, it } from 'vitest';
import { tickASeason } from './tickASeason';
import type { CatalogueSeason } from '@ValenceContracts/schemas/MediaRequest';

const aSeason = (season: number): CatalogueSeason => ({
  season,
  episodeCount: 10,
  firstAired: null,
  standing: 'askable',
});

const THREE = [aSeason(1), aSeason(2), aSeason(3)];

describe('tickASeason', () => {
  it('unticks one out of every season', () => {
    expect(tickASeason(null, THREE, 2)).toEqual([1, 3]);
  });

  it('ticks one more, in order', () => {
    expect(tickASeason([3], THREE, 1)).toEqual([1, 3]);
  });

  it('goes back to every season once the last is ticked, so later ones come too', () => {
    expect(tickASeason([1, 3], THREE, 2)).toBeNull();
  });

  it('leaves nothing ticked where the last one is unticked', () => {
    expect(tickASeason([2], THREE, 2)).toEqual([]);
  });
});
