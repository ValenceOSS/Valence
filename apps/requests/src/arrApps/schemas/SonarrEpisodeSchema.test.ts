import { describe, expect, it } from 'vitest';
import { SonarrEpisodeSchema } from './SonarrEpisodeSchema';

describe('SonarrEpisodeSchema', () => {
  it('reads an episode, whether it has a file and when it aired', () => {
    expect(
      SonarrEpisodeSchema.parse({
        seriesId: 3,
        tvdbId: 8_675_309,
        episodeFileId: 77,
        seasonNumber: 1,
        episodeNumber: 2,
        title: 'Half Loop',
        airDate: '2022-02-18',
        airDateUtc: '2022-02-18T08:00:00Z',
        overview: '…',
        hasFile: true,
        monitored: true,
        absoluteEpisodeNumber: 2,
        unverifiedSceneNumbering: false,
        id: 41,
      }),
    ).toEqual({
      id: 41,
      seasonNumber: 1,
      episodeNumber: 2,
      hasFile: true,
      monitored: true,
      episodeFileId: 77,
      airDateUtc: '2022-02-18T08:00:00Z',
    });
  });
});
