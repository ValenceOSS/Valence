import { describe, expect, it } from 'vitest';
import { judgeAnime } from './judgeAnime';

const release = (
  spokenAudio: 'dual' | 'dubbed' | 'subbed' | null,
  group: string | null = null,
) => ({
  spokenAudio,
  group,
});

describe('judgeAnime', () => {
  it('refuses a dub where subtitles are wanted, and nothing else', () => {
    expect(judgeAnime(release('dubbed'), 'subbed', null).rejections).toHaveLength(1);
    expect(judgeAnime(release('dual'), 'subbed', null).rejections).toEqual([]);
    expect(judgeAnime(release(null), 'subbed', null).rejections).toEqual([]);
  });

  it('refuses anything without a dub where one is wanted, taking unsaid as subtitled', () => {
    expect(judgeAnime(release(null), 'dubbed', null).rejections).toHaveLength(1);
    expect(judgeAnime(release('dual'), 'dubbed', null).rejections).toEqual([]);
  });

  it('refuses anything but dual audio where that is wanted', () => {
    expect(judgeAnime(release('dubbed'), 'dual', null).rejections).toHaveLength(1);
    expect(judgeAnime(release('dual'), 'dual', null).rejections).toEqual([]);
  });

  it('scores a dub above subtitles where subtitles do until one comes', () => {
    expect(judgeAnime(release('dual'), 'subbedUntilDubbed', null)).toMatchObject({
      score: 100,
      rejections: [],
    });
    expect(judgeAnime(release(null), 'subbedUntilDubbed', null).score).toBe(0);
  });

  it("scores the show's own release group above any other", () => {
    expect(judgeAnime(release(null, 'Group'), 'subbed', 'group').score).toBe(200);
    expect(judgeAnime(release(null, 'Other'), 'subbed', 'group').score).toBe(0);
  });
});
