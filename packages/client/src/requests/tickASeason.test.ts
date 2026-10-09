import { describe, expect, it } from 'vitest';
import { tickASeason } from './tickASeason';
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

const THREE = [aSeason(1), aSeason(2), aSeason(3)];

describe('tickASeason', () => {
  it('unticks one out of every season', () => {
    expect(tickASeason(null, THREE, 2)).toEqual([1, 3]);
  });

  it('ticks one more, in order', () => {
    expect(tickASeason([3], THREE, 1)).toEqual([1, 3]);
  });

  it('ticks Specials on their own, never as part of every season', () => {
    const withSpecials = [aSeason(0), ...THREE];

    expect(tickASeason(null, withSpecials, 0)).toEqual([0, 1, 2, 3]);
    expect(tickASeason([0, 1, 2, 3], withSpecials, 0)).toBeNull();
  });

  it('goes back to every season once the last is ticked', () => {
    expect(tickASeason([1, 3], THREE, 2)).toBeNull();
  });

  it('leaves nothing ticked where the last one is unticked', () => {
    expect(tickASeason([2], THREE, 2)).toEqual([]);
  });

  it('goes back to every season once every one not already held is ticked', () => {
    const someHeld = [aSeason(1, 'library'), aSeason(2), aSeason(3, 'partly')];

    expect(tickASeason([2], someHeld, 3)).toBeNull();
    expect(tickASeason(null, someHeld, 3)).toEqual([2]);
  });
});
