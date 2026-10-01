import { describe, expect, it } from 'vitest';
import { sonarrSeriesOf } from './sonarrSeriesOf';
import { aSeerrRequest } from './testing/aSeerrRequest';

const facts = {
  tmdbId: 66732,
  tvdbId: 305288,
  title: { title: 'Stranger Things', year: 2016, overview: null, posterUrl: null },
  isEnded: false,
  seasons: new Map([
    [1, 8],
    [2, 9],
  ]),
  held: new Map<number, number>(),
  request: null,
  isHeld: false,
  qualityProfileId: 1,
  rootFolderPath: '/media/Series',
};

describe('sonarrSeriesOf', () => {
  it('gives a series nobody asked for no id, and every season unwatched', () => {
    const series = sonarrSeriesOf(facts);

    expect(series).not.toHaveProperty('id');
    expect(series.seasons.map((season) => season.monitored)).toEqual([false, false]);
    expect(series.status).toBe('continuing');
  });

  it('watches only the seasons asked for', () => {
    const series = sonarrSeriesOf({
      ...facts,
      request: aSeerrRequest({ kind: 'series', seasons: [2] }),
    });

    expect(series.id).toBe(66732);
    expect(series.seasons.map((season) => season.monitored)).toEqual([false, true]);
  });

  it('watches every season of a request for the whole series', () => {
    const series = sonarrSeriesOf({
      ...facts,
      request: aSeerrRequest({ kind: 'series', seasons: null }),
    });

    expect(series.seasons.every((season) => season.monitored)).toBe(true);
  });

  it('counts each season against every episode it has, so a complete one reads complete', () => {
    const series = sonarrSeriesOf({
      ...facts,
      request: aSeerrRequest({ kind: 'series', seasons: null }),
      held: new Map([
        [1, 8],
        [2, 3],
      ]),
    });

    expect(series.seasons[0]?.statistics).toMatchObject({
      episodeFileCount: 8,
      totalEpisodeCount: 8,
      percentOfEpisodes: 100,
    });
    expect(series.seasons[1]?.statistics).toMatchObject({
      episodeFileCount: 3,
      totalEpisodeCount: 9,
    });
    expect(series.statistics).toMatchObject({
      seasonCount: 2,
      episodeFileCount: 11,
      totalEpisodeCount: 17,
      episodeCount: 17,
    });
  });

  it('never counts more episodes on disk than a season has', () => {
    const series = sonarrSeriesOf({ ...facts, held: new Map([[1, 10]]) });

    expect(series.seasons[0]?.statistics.episodeFileCount).toBe(8);
  });

  it('lists a season the library holds that the catalogue has not heard of', () => {
    const series = sonarrSeriesOf({ ...facts, held: new Map([[3, 2]]) });

    expect(series.seasons.map((season) => season.seasonNumber)).toEqual([1, 2, 3]);
  });
});
