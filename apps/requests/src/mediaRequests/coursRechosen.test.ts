import { describe, expect, it } from 'vitest';
import { anAnimeShow } from '@ValenceRequests/testing/anAnimeShow';
import { coursRechosen } from './coursRechosen';

const { anime } = anAnimeShow();

const cour = (number: number, name: string, season: number, episodeCount: number) => ({
  cour: number,
  name,
  names: [name],
  anilistId: null,
  malId: null,
  season,
  firstAired: null,
  episodeCount,
});

const bySeasons = {
  ...anime,
  courSource: 'seasons' as const,
  cours: [cour(1, 'Show', 1, 24), cour(2, 'Show Final Season', 2, 12)],
  episodes: anime.episodes.map((one) => ({ ...one, cour: one.season })),
};

describe('coursRechosen', () => {
  it('wants the same episodes once the cours are worked out differently', () => {
    expect(
      coursRechosen({ seasons: [2], followsNewSeasons: false, followsAfter: 3, anime }, bySeasons),
    ).toEqual({ seasons: [1], followsAfter: 2 });
    expect(
      coursRechosen({ seasons: [3], followsNewSeasons: false, followsAfter: 3, anime }, bySeasons),
    ).toEqual({ seasons: [2], followsAfter: 2 });
  });

  it('leaves every cour as every cour', () => {
    expect(
      coursRechosen({ seasons: null, followsNewSeasons: true, followsAfter: 3, anime }, bySeasons),
    ).toBeNull();
  });
});
