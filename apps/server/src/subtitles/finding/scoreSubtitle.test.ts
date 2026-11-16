import { describe, expect, it } from 'vitest';
import { scoreSubtitle } from './scoreSubtitle';
import type { SubtitleVideo } from './SubtitleVideo';

const FILM: SubtitleVideo = {
  kind: 'movie',
  parts: {
    group: 'egen',
    source: 'webdl',
    resolution: '1080p',
    videoCodec: 'h264',
    audioCodec: 'eac3',
    service: null,
    edition: null,
  },
  season: null,
  episode: null,
  frameRate: 23.976,
};

const EPISODE: SubtitleVideo = { ...FILM, kind: 'episode', season: 1, episode: 2 };

/**
 * Scores a subtitle by its release name alone, against the film unless told otherwise.
 *
 * @param release - The subtitle's release name.
 * @param video - The file.
 * @returns The score.
 */
const scored = (release: string, video: SubtitleVideo = FILM) =>
  scoreSubtitle(video, { release, frameRate: null, isExactMatch: false });

describe('scoreSubtitle', () => {
  it('scores the same release as Bazarr would, short only of the audio codec it does not name', () => {
    const same = scored('A.Film.2020.1080p.WEB.H264-EGEN');

    expect(same.score).toBe(99);
    expect(same.misses).toEqual([]);
    expect(same.unknowns).toEqual(['edition', 'frameRate', 'audioCodec', 'streamingService']);
    expect(same.reasons).toContain('sameRelease');
  });

  it('gives a subtitle naming nothing of the release what the right film and no edition earn', () => {
    const plain = scored('A.Film.2020');

    expect(plain.score).toBe(73);
    expect(plain.matches).toEqual([]);
    expect(plain.misses).toEqual([]);
    expect(plain.unknowns).toHaveLength(8);
  });

  it('counts a web rip and a web download as the same source, as Bazarr does', () => {
    const rip = scored('A.Film.2020.WEBRip.x264-OTHER');

    expect(rip.score).toBe(91);
    expect(rip.matches).toEqual(['source', 'videoCodec']);
    expect(rip.misses).toEqual(['releaseGroup']);
  });

  it('counts the release group only where the source matches too', () => {
    expect(scored('A.Film.2020.BluRay.x264-EGEN').misses).toEqual(['source', 'releaseGroup']);
  });

  it('says what neither names is unknown, though an edition named by neither still scores', () => {
    const plain = scored('A.Film.2020');

    expect(plain.unknowns).toContain('edition');
    expect(plain.unknowns).toContain('streamingService');
    expect(scored('A.Film.2020.Extended').score).toBeLessThan(plain.score);
  });

  it('counts groups Bazarr holds to be the same as one', () => {
    const video: SubtitleVideo = { ...FILM, parts: { ...FILM.parts, group: 'framestor' } };

    expect(scored('A.Film.2020.WEB-DL-W4NK3R', video).matches).toContain('releaseGroup');
  });

  it('misses an edition the subtitle names and the file does not', () => {
    expect(scored('A.Film.2020.Extended.1080p.WEB.H264-EGEN').misses).toContain('edition');
  });

  it('counts 23.976 and 24 fps as one, and scores one that would drift at nothing', () => {
    const film = scoreSubtitle(FILM, {
      release: 'A.Film.2020',
      frameRate: 24,
      isExactMatch: false,
    });
    const pal = scoreSubtitle(FILM, { release: 'A.Film.2020', frameRate: 25, isExactMatch: false });

    expect(film.matches).toContain('frameRate');
    expect(pal).toMatchObject({ score: 0, isDrifting: true });
    expect(pal.misses).toContain('frameRate');
    expect(pal.reasons).toContain('differentFrameRate');
  });

  it('gives one made for this very file full marks', () => {
    expect(
      scoreSubtitle(FILM, { release: 'anything', frameRate: null, isExactMatch: true }),
    ).toMatchObject({ score: 100, reasons: ['madeForThisFile'], misses: [] });
  });

  it('weighs an episode by its programme, season and number, and the source after', () => {
    expect(scored('Show.S01E02', EPISODE).score).toBe(87);
    expect(scored('Show.S01E02.WEB', EPISODE).score).toBe(94);
  });

  it('marks one whose name gives another season or episode', () => {
    expect(scored('Show.S01E03.WEB', EPISODE).isAnotherEpisode).toBe(true);
    expect(scored('Show.S02E02.WEB', EPISODE).isAnotherEpisode).toBe(true);
    expect(scored('Show.S01.WEB', EPISODE).isAnotherEpisode).toBe(false);
  });
});
