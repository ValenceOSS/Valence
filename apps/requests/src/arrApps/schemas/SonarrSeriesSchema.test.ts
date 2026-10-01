import { describe, expect, it } from 'vitest';
import { SonarrSeriesSchema } from './SonarrSeriesSchema';

describe('SonarrSeriesSchema', () => {
  it('reads a series Sonarr has, with each season and whether it is monitored', () => {
    expect(
      SonarrSeriesSchema.parse({
        title: 'Severance',
        sortTitle: 'severance',
        status: 'continuing',
        ended: false,
        overview: 'Mark leads a team…',
        network: 'Apple TV+',
        images: [],
        seasons: [
          { seasonNumber: 0, monitored: false },
          {
            seasonNumber: 1,
            monitored: true,
            statistics: { episodeFileCount: 9, episodeCount: 9, totalEpisodeCount: 9 },
          },
        ],
        year: 2022,
        path: '/tv/Severance',
        qualityProfileId: 4,
        seasonFolder: true,
        monitored: true,
        tvdbId: 371_980,
        tvRageId: 0,
        tvMazeId: 44_933,
        tmdbId: 95_396,
        seriesType: 'standard',
        rootFolderPath: '/tv/',
        id: 3,
      }),
    ).toEqual({
      id: 3,
      tvdbId: 371_980,
      title: 'Severance',
      path: '/tv/Severance',
      monitored: true,
      seasons: [
        { seasonNumber: 0, monitored: false },
        { seasonNumber: 1, monitored: true },
      ],
    });
  });

  it('reads a series from a lookup, which has no id yet', () => {
    expect(
      SonarrSeriesSchema.parse({ title: 'Severance', tvdbId: 371_980, remotePoster: 'x' }),
    ).toMatchObject({ id: 0, seasons: [], monitored: false });
  });
});
