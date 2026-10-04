import { describe, expect, it } from 'vitest';
import { describePlaybackFailure, PlaybackEngineErrorSchema } from './describePlaybackFailure';

describe('describePlaybackFailure', () => {
  it('blames the browser only when the browser could not decode it', () => {
    expect(describePlaybackFailure(3)).toBe('This browser can’t decode the stream.');
  });

  it('says only that the stream would not load when the manifest could not be read', () => {
    expect(describePlaybackFailure(4)).toContain('Couldn’t load the stream');
  });

  it('says the same when the network failed', () => {
    expect(describePlaybackFailure(1)).toContain('Couldn’t load the stream');
  });

  it('says the same when streaming stopped', () => {
    expect(describePlaybackFailure(5)).toContain('Couldn’t load the stream');
  });

  it('never blames the server for converting, which is a cause it cannot know', () => {
    for (const category of [1, 4, 5]) {
      expect(describePlaybackFailure(category)).not.toContain('convert');
    }
  });

  it('does not blame the decoder when the browser only refused to hold a segment', () => {
    expect(describePlaybackFailure(3, 3017)).toContain('Couldn’t load the stream');
    expect(describePlaybackFailure(3, 3016)).toBe('This browser can’t decode the stream.');
  });

  it('does not blame the browser for a failure it cannot place', () => {
    expect(describePlaybackFailure(null)).toBe('Couldn’t play the stream.');
    expect(describePlaybackFailure(9)).toBe('Couldn’t play the stream.');
  });
});

describe('PlaybackEngineErrorSchema', () => {
  it('reads the category off an engine failure', () => {
    const parsed = PlaybackEngineErrorSchema.safeParse({ category: 4, code: 1001 });

    expect(parsed.success && parsed.data.category).toBe(4);
    expect(parsed.success && parsed.data.code).toBe(1001);
  });

  it('refuses anything else a catch might hand it', () => {
    expect(PlaybackEngineErrorSchema.safeParse(new Error('boom')).success).toBe(false);
    expect(PlaybackEngineErrorSchema.safeParse('boom').success).toBe(false);
    expect(PlaybackEngineErrorSchema.safeParse(undefined).success).toBe(false);
  });
});
