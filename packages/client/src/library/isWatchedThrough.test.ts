import { describe, expect, it } from 'vitest';
import { aMediaSummary } from '@ValenceClient/testing/aMediaSummary';
import { isWatchedThrough } from './isWatchedThrough';

const TODAY = '2026-10-06';

const anEpisode = (id: string, seasonNumber: number, episodeNumber: number) =>
  aMediaSummary({ id, seasonNumber, episodeNumber });

const SEASON_ONE = {
  seasonNumber: 1,
  episodes: [anEpisode('s1e1', 1, 1), anEpisode('s1e2', 1, 2)],
};

const aired = (episodeNumber: number, airDate: string | null = '2025-01-01') => ({
  episodeNumber,
  title: `Episode ${episodeNumber.toString()}`,
  airDate,
});

const ALL = () => true;

describe('isWatchedThrough', () => {
  it('is watched through once every episode held is watched, where nothing more is known', () => {
    expect(isWatchedThrough({ seasons: [SEASON_ONE], shape: null }, ALL, TODAY)).toBe(true);
  });

  it('is not watched through while an episode held is still to finish', () => {
    expect(
      isWatchedThrough({ seasons: [SEASON_ONE], shape: null }, (id) => id === 's1e1', TODAY),
    ).toBe(false);
  });

  it('is not watched through with a first season done and a second already aired', () => {
    const shape = [
      { seasonNumber: 1, episodeCount: 2, episodes: [aired(1), aired(2)] },
      { seasonNumber: 2, episodeCount: 2, episodes: [aired(1), aired(2)] },
    ];

    expect(isWatchedThrough({ seasons: [SEASON_ONE], shape }, ALL, TODAY)).toBe(false);
  });

  it('is watched through with only what is still to air left', () => {
    const shape = [
      { seasonNumber: 1, episodeCount: 2, episodes: [aired(1), aired(2)] },
      { seasonNumber: 2, episodeCount: 2, episodes: [aired(1, '2027-03-01'), aired(2, null)] },
    ];

    expect(isWatchedThrough({ seasons: [SEASON_ONE], shape }, ALL, TODAY)).toBe(true);
  });

  it('is not watched through while an aired episode of a season held is missing', () => {
    const shape = [{ seasonNumber: 1, episodeCount: 3, episodes: [aired(1), aired(2), aired(3)] }];

    expect(isWatchedThrough({ seasons: [SEASON_ONE], shape }, ALL, TODAY)).toBe(false);
  });

  it('leaves the specials out of it', () => {
    const shape = [
      { seasonNumber: 0, episodeCount: 1, episodes: [aired(1)] },
      { seasonNumber: 1, episodeCount: 2, episodes: [aired(1), aired(2)] },
    ];

    expect(isWatchedThrough({ seasons: [SEASON_ONE], shape }, ALL, TODAY)).toBe(true);
  });

  it('is never watched through with nothing held', () => {
    expect(isWatchedThrough({ seasons: [], shape: null }, ALL, TODAY)).toBe(false);
  });
});
