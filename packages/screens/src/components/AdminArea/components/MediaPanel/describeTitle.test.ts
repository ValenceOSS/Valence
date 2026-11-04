import { describe, expect, it } from 'vitest';
import { describeTitle } from './describeTitle';
import { gatherTitles } from './gatherTitles';
import { aMediaSummary } from '@ValenceClient/testing/aMediaSummary';

const episodeOf = (id: string, season: number, number: number) =>
  aMediaSummary({
    id,
    seriesId: 'show',
    seriesTitle: 'Show',
    seasonNumber: season,
    episodeNumber: number,
  });

describe('describeTitle', () => {
  it('counts the seasons and episodes of a series', () => {
    const [show] = gatherTitles([episodeOf('a', 1, 1), episodeOf('b', 1, 2), episodeOf('c', 2, 1)]);

    expect(show === undefined ? '' : describeTitle(show)).toBe('2 seasons · 3 episodes');
  });

  it('counts the editions of a film held more than once', () => {
    const [film] = gatherTitles([
      aMediaSummary({ id: 'film' }),
      aMediaSummary({ id: 'cut', parentId: 'film', versionLabel: 'Long' }),
    ]);

    expect(film === undefined ? '' : describeTitle(film)).toBe('2 editions');
  });

  it('says how long and how sharp a single film is', () => {
    const [film] = gatherTitles([
      aMediaSummary({
        id: 'film',
        durationSeconds: 5400,
        width: 1920,
        height: 1080,
        videoCodec: 'hevc',
      }),
    ]);

    expect(film === undefined ? '' : describeTitle(film)).toContain('HEVC');
  });
});
