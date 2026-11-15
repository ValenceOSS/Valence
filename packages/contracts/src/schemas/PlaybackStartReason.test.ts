import { describe, expect, it } from 'vitest';
import { PlaybackStartReasonSchema } from './PlaybackStartReason';

describe('PlaybackStartReasonSchema', () => {
  it('takes the reasons a player starts a stream for', () => {
    expect(PlaybackStartReasonSchema.parse('recovering')).toBe('recovering');
  });

  it('refuses a reason it does not know', () => {
    expect(PlaybackStartReasonSchema.safeParse('boredom').success).toBe(false);
  });
});
