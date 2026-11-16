import { describe, expect, it } from 'vitest';
import { CastPlayedSchema } from './CastPlayed';

describe('CastPlayedSchema', () => {
  it('reads how far in the device is and whether it plays', () => {
    expect(CastPlayedSchema.parse({ seconds: 61.5, isPlaying: true })).toEqual({
      seconds: 61.5,
      isPlaying: true,
    });
  });

  it('refuses a position before the start', () => {
    expect(CastPlayedSchema.safeParse({ seconds: -1, isPlaying: false }).success).toBe(false);
  });
});
