import { describe, expect, it } from 'vitest';
import { reachOfEachSeries } from './reachOfEachSeries';
import type { EpisodeNumbering } from './EpisodeNumbering.types';

/**
 * Where an episode, or an extra, of a programme was placed.
 *
 * @param seriesFolder - The programme's folder.
 * @param seasonNumber - Its season.
 * @param episodeNumber - Its number.
 * @param overrides - Anything else about it.
 * @returns The placement.
 */
const placed = (
  seriesFolder: string | null,
  seasonNumber: number | null,
  episodeNumber: number | null,
  overrides: Partial<EpisodeNumbering> & { isExtra?: boolean } = {},
) => {
  const { isExtra = false, ...episode } = overrides;

  return {
    episode: {
      seriesTitle: 'Show',
      seriesYear: null,
      seriesFolder,
      seasonNumber,
      episodeNumber,
      episodeNumberEnd: null,
      episodeTitle: null,
      ...episode,
    },
    extra: isExtra ? { kind: 'featurette' as const, parentPath: null, seriesFolder } : null,
  };
};

describe('reachOfEachSeries', () => {
  it('finds the furthest season, and the furthest episode in it, of each programme', () => {
    expect(
      reachOfEachSeries(
        new Map([
          ['a', placed('/Show', 1, 24)],
          ['b', placed('/Show', 3, 2)],
          ['c', placed('/Show', 3, 5, { episodeNumberEnd: 6 })],
          ['d', placed('/Other', 1, 1)],
        ]),
      ),
    ).toEqual(
      new Map([
        ['/Show', { season: 3, episode: 6 }],
        ['/Other', { season: 1, episode: 1 }],
      ]),
    );
  });

  it('leaves out specials, extras, films and files without numbers', () => {
    expect(
      reachOfEachSeries(
        new Map([
          ['a', placed('/Show', 0, 9)],
          ['b', placed('/Show', 4, 1, { isExtra: true })],
          ['c', placed(null, null, null)],
          ['d', placed('/Show', 2, null)],
        ]),
      ),
    ).toEqual(new Map());
  });
});
