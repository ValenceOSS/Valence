import { describe, expect, it } from 'vitest';
import { episodeNumbersOf } from './episodeNumbersOf';

describe('episodeNumbersOf', () => {
  it('holds one episode where the file names one', () => {
    expect(episodeNumbersOf(4, null)).toEqual([4]);
  });

  it('holds every episode from the first to the last of a double episode', () => {
    expect(episodeNumbersOf(1, 3)).toEqual([1, 2, 3]);
  });

  it('holds only the first where the last cannot follow it', () => {
    expect(episodeNumbersOf(5, 2)).toEqual([5]);
  });
});
