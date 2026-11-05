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

  it('counts a series’ episodes out of how many TMDB lists, where it knows', () => {
    const [show] = gatherTitles([episodeOf('a', 1, 1), episodeOf('b', 1, 2)]);

    expect(
      show === undefined
        ? ''
        : describeTitle({
            ...show,
            row: {
              id: 'x',
              key: 'x',
              kind: 'show',
              libraryId: 'lib',
              lead: show.lead,
              name: 'Show',
              order: 'show',
              year: null,
              files: 2,
              versions: 0,
              seasons: 1,
              episodes: 2,
              episodeTotal: 10,
              sizeBytes: null,
              durationSeconds: 0,
              latestAddedAt: show.addedAt,
              isMatched: true,
              posterFrom: null,
              folder: null,
              leadPath: null,
              looks: {
                step: null,
                isStepMixed: false,
                range: null,
                isRangeMixed: false,
                codec: null,
                isCodecMixed: false,
                audio: null,
                isAudioMixed: false,
              },
              problemFiles: { duplicate: [], unreadable: [] },
              isEdited: false,
            },
          }),
    ).toBe('1 season · 2 of 10 episodes');
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
