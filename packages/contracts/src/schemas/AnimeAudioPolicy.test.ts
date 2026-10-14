import { describe, expect, it } from 'vitest';
import { AnimeAudioPolicySchema } from './AnimeAudioPolicy';

describe('AnimeAudioPolicy', () => {
  it('takes subtitles, a dub, dual audio, or subtitles until a dub comes', () => {
    expect(AnimeAudioPolicySchema.options).toEqual([
      'subbed',
      'dubbed',
      'dual',
      'subbedUntilDubbed',
    ]);
    expect(AnimeAudioPolicySchema.safeParse('raw').success).toBe(false);
  });
});
