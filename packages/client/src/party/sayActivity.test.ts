import { describe, expect, it } from 'vitest';
import { sayActivity } from './sayActivity';

const words = { isDoing: 'Watching', isPaused: 'Paused', notDoing: 'Not watching' };

describe('sayActivity', () => {
  it('names each of the three in the party’s own words', () => {
    expect(sayActivity({ isWatching: true }, { isPlaying: true }, words)).toBe('Watching');
    expect(sayActivity({ isWatching: false }, { isPlaying: false }, words)).toBe('Paused');
    expect(sayActivity({ isWatching: false }, { isPlaying: true }, words)).toBe('Not watching');
  });
});
