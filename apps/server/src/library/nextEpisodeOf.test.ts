import { describe, expect, it } from 'vitest';
import { nextEpisodeOf } from '@ValenceServer/library/nextEpisodeOf';
import type { SeriesShape } from '@ValenceServer/library/MetadataProvider';

const episode = (episodeNumber: number, airDate: string | null) => ({
  episodeNumber,
  title: `Episode ${episodeNumber.toString()}`,
  stillUrl: null,
  overview: null,
  airDate,
});

const season = (seasonNumber: number, episodes: ReturnType<typeof episode>[]) => ({
  seasonNumber,
  episodeCount: episodes.length,
  episodes,
});

const TODAY = '2026-09-21';

describe('nextEpisodeOf', () => {
  it('finds the soonest episode still to come', () => {
    const seasons: SeriesShape['seasons'] = [
      season(1, [episode(1, '2026-09-01'), episode(2, '2026-09-28'), episode(3, '2026-10-05')]),
    ];

    expect(nextEpisodeOf(seasons, TODAY)).toEqual({
      seasonNumber: 1,
      episodeNumber: 2,
      title: 'Episode 2',
      airDate: '2026-09-28',
    });
  });

  it('counts an episode out today, since somebody will want to know', () => {
    expect(nextEpisodeOf([season(2, [episode(4, TODAY)])], TODAY)?.episodeNumber).toBe(4);
  });

  it('finds nothing where every episode has aired', () => {
    expect(nextEpisodeOf([season(1, [episode(1, '2026-01-01')])], TODAY)).toBeNull();
  });

  it('skips an episode with no date, and specials', () => {
    const seasons = [season(0, [episode(1, '2026-09-22')]), season(1, [episode(1, null)])];

    expect(nextEpisodeOf(seasons, TODAY)).toBeNull();
  });

  it('looks across seasons, and takes the earlier season when two air the same day', () => {
    const seasons = [
      season(2, [episode(1, '2026-10-01')]),
      season(1, [episode(9, '2026-10-01'), episode(10, '2026-11-01')]),
    ];

    expect(nextEpisodeOf(seasons, TODAY)).toMatchObject({ seasonNumber: 1, episodeNumber: 9 });
  });

  it('finds nothing in a programme with no seasons', () => {
    expect(nextEpisodeOf([], TODAY)).toBeNull();
  });
});
