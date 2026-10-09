import { describe, expect, it } from 'vitest';
import { describeNarration } from './describeNarration';

describe('describeNarration', () => {
  it('says who reads a narration, and for how long where that is known', () => {
    expect(describeNarration({ narrators: ['Ann Reader', 'Bob Voice'], runtimeMinutes: 732 })).toBe(
      'Read by Ann Reader and Bob Voice, 12 h 12 min',
    );
    expect(describeNarration({ narrators: ['Ann Reader'], runtimeMinutes: null })).toBe(
      'Read by Ann Reader',
    );
  });
});
