import { describe, expect, it } from 'vitest';
import { placeInEpisodeOrder } from './placeInEpisodeOrder';

const DVD = [
  { order: 0, episodes: [{ season: 0, episode: 3 }] },
  {
    order: 1,
    episodes: [
      { season: 1, episode: 2 },
      { season: 1, episode: 1 },
      { season: 2, episode: 1 },
    ],
  },
];

describe('placeInEpisodeOrder', () => {
  it('finds the catalogue’s episode at a file’s place in the order', () => {
    expect(placeInEpisodeOrder(DVD, 1, 1, null)).toEqual([{ season: 1, episode: 2 }]);
    expect(placeInEpisodeOrder(DVD, 0, 1, null)).toEqual([{ season: 0, episode: 3 }]);
  });

  it('finds every episode a file of several holds', () => {
    expect(placeInEpisodeOrder(DVD, 1, 2, 3)).toEqual([
      { season: 1, episode: 1 },
      { season: 2, episode: 1 },
    ]);
  });

  it('has nothing where the order has no such place', () => {
    expect(placeInEpisodeOrder(DVD, 2, 1, null)).toBeNull();
    expect(placeInEpisodeOrder(DVD, 1, 9, null)).toBeNull();
  });
});
