import { describe, expect, it } from 'vitest';
import { memberActivity } from './memberActivity';

describe('memberActivity', () => {
  it('says somebody playing along is doing so', () => {
    expect(memberActivity({ isWatching: true }, { isPlaying: true })).toBe('doing');
  });

  it('says everybody is paused while the party is', () => {
    expect(memberActivity({ isWatching: false }, { isPlaying: false })).toBe('paused');
  });

  it('says somebody is not along when the party plays without them', () => {
    expect(memberActivity({ isWatching: false }, { isPlaying: true })).toBe('notDoing');
  });
});
