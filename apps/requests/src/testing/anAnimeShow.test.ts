import { describe, expect, it } from 'vitest';
import { anAnimeShow } from './anAnimeShow';

describe('anAnimeShow', () => {
  it('makes three cours of twelve, and an episode for each', () => {
    const { anime, items } = anAnimeShow();

    expect(anime.cours.map((one) => one.name)).toEqual([
      'Show',
      'Show Second Arc',
      'Show Final Season',
    ]);
    expect(items).toHaveLength(36);
    expect(items[12]).toMatchObject({ season: 1, episode: 13, cour: 2, absolute: 13 });
    expect(items[24]).toMatchObject({ season: 2, episode: 1, cour: 3, airDate: '2021-01-03' });
  });
});
