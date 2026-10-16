import { describe, expect, it } from 'vitest';
import { episodesByChoice } from './episodesByChoice';
import type { AnimeFacts } from '@ValenceContracts/schemas/Anime';

const episodes = [
  { season: 0, episode: 1, title: 'Special', airDate: null },
  { season: 1, episode: 1, title: 'One', airDate: null },
  { season: 1, episode: 13, title: 'Thirteen', airDate: null },
];

const anime: AnimeFacts = {
  anilistId: null,
  malId: null,
  names: { english: null, romaji: null, native: null, others: [] },
  cours: [],
  episodes: [
    { season: 0, episode: 1, absolute: null, cour: 0 },
    { season: 1, episode: 1, absolute: 1, cour: 1 },
    { season: 1, episode: 13, absolute: 13, cour: 2 },
  ],
  courSource: 'anilist',
  groupId: null,
  groups: [],
  films: [],
};

describe('episodesByChoice', () => {
  it('numbers a series by its seasons', () => {
    expect(episodesByChoice({ episodes })).toEqual(episodes);
  });

  it('numbers anime by its cours, Specials staying Specials', () => {
    expect(episodesByChoice({ episodes, anime }).map((one) => one.season)).toEqual([0, 1, 2]);
  });
});
