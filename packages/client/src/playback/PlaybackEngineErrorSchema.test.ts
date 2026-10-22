import { describe, expect, it } from 'vitest';
import { PlaybackEngineErrorSchema } from './PlaybackEngineErrorSchema';

describe('PlaybackEngineErrorSchema', () => {
  it('reads the category off an engine failure', () => {
    const parsed = PlaybackEngineErrorSchema.safeParse({ category: 4, code: 1001 });

    expect(parsed.success && parsed.data.category).toBe(4);
  });

  it('refuses anything that is not an engine failure', () => {
    expect(PlaybackEngineErrorSchema.safeParse(new Error('boom')).success).toBe(false);
    expect(PlaybackEngineErrorSchema.safeParse('boom').success).toBe(false);
    expect(PlaybackEngineErrorSchema.safeParse(undefined).success).toBe(false);
  });
});
