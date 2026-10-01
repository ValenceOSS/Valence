import { describe, expect, it } from 'vitest';
import { episodeIdOf } from './episodeIdOf';

describe('episodeIdOf', () => {
  it('gives every episode of a series a number of its own', () => {
    expect(episodeIdOf(1, 2)).toBe(10_002);
    expect(episodeIdOf(2, 1)).not.toBe(episodeIdOf(1, 2));
  });

  it('never answers nought, even for the first special', () => {
    expect(episodeIdOf(0, 1)).toBe(1);
  });
});
