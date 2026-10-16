import { describe, expect, it } from 'vitest';
import { courSeasonsOf } from './courSeasonsOf';
import type { AnimeFacts } from '@ValenceContracts/schemas/Anime';

const episodes = Array.from({ length: 4 }, (_unused, at) => ({
  season: 1,
  episode: at + 1,
  title: '',
  airDate: `2020-01-0${(at + 1).toString()}`,
}));

const anime: AnimeFacts = {
  anilistId: null,
  malId: null,
  names: { english: null, romaji: null, native: null, others: [] },
  cours: [
    {
      cour: 1,
      name: 'Show',
      names: [],
      anilistId: null,
      malId: null,
      season: null,
      firstAired: null,
      episodeCount: 2,
    },
    {
      cour: 2,
      name: 'Show Part 2',
      names: [],
      anilistId: null,
      malId: null,
      season: null,
      firstAired: null,
      episodeCount: 2,
    },
  ],
  episodes: episodes.map((one, at) => ({
    season: 1,
    episode: one.episode,
    absolute: at + 1,
    cour: at < 2 ? 1 : 2,
  })),
  courSource: 'anilist',
  groupId: null,
  groups: [],
  films: [],
};

describe('courSeasonsOf', () => {
  it("offers an anime's cours, each named, with where it stands", () => {
    expect(
      courSeasonsOf(
        episodes,
        anime,
        [{ items: [{ season: 1, cour: 2, state: 'wanted' }] }],
        [
          { season: 1, episode: 1 },
          { season: 1, episode: 2 },
        ],
      ),
    ).toEqual([
      { season: 1, name: 'Show', episodeCount: 2, firstAired: '2020-01-01', standing: 'library' },
      {
        season: 2,
        name: 'Show Part 2',
        episodeCount: 2,
        firstAired: '2020-01-03',
        standing: 'requested',
      },
    ]);
  });
});
