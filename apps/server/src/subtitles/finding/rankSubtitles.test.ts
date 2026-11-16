import { describe, expect, it } from 'vitest';
import { rankSubtitles } from './rankSubtitles';
import type { FoundSubtitle } from '@ValenceContracts/schemas/SubtitleFinding';
import type { SubtitleVideo } from './SubtitleVideo';

const EPISODE: SubtitleVideo = {
  kind: 'episode',
  parts: {
    group: 'egen',
    source: 'webdl',
    resolution: '1080p',
    videoCodec: 'h264',
    audioCodec: null,
    service: null,
    edition: null,
  },
  season: 1,
  episode: 2,
  frameRate: 23.976,
};

/**
 * A subtitle as a site returns it, before it is scored.
 *
 * @param id - Its id.
 * @param name - Its release name.
 * @param change - Anything else that differs.
 * @returns The subtitle.
 */
const found = (id: string, name: string, change: Partial<FoundSubtitle> = {}): FoundSubtitle => ({
  source: 'subdl',
  id,
  name,
  language: 'en',
  isExactMatch: false,
  isHearingImpaired: false,
  isMachineTranslated: false,
  frameRate: null,
  downloads: null,
  score: 0,
  reasons: [],
  matches: [],
  misses: [],
  unknowns: [],
  ...change,
});

describe('rankSubtitles', () => {
  it('puts the file’s own first, then the best fit, and one that would drift last', () => {
    const ranked = rankSubtitles(EPISODE, [
      found('drifts', 'Show.S01E02.1080p.WEB.H264-EGEN', { frameRate: 25 }),
      found('plain', 'Show.S01E02'),
      found('release', 'Show.S01E02.1080p.WEB.H264-EGEN'),
      found('own', 'Show.S01E02', { isExactMatch: true }),
    ]);

    expect(ranked.map((one) => one.id)).toEqual(['own', 'release', 'plain', 'drifts']);
    expect(ranked[1]?.matches).toContain('releaseGroup');
  });

  it('breaks a tie by downloads', () => {
    const ranked = rankSubtitles(EPISODE, [
      found('fewer', 'Show.S01E02', { downloads: 10 }),
      found('more', 'Show.S01E02', { downloads: 900 }),
    ]);

    expect(ranked.map((one) => one.id)).toEqual(['more', 'fewer']);
  });

  it('leaves out one whose name gives another episode', () => {
    expect(
      rankSubtitles(EPISODE, [found('other', 'Show.S01E05.WEB'), found('this', 'Show.S01E02')]).map(
        (one) => one.id,
      ),
    ).toEqual(['this']);
  });
});
