import { describe, expect, it } from 'vitest';
import { aJellyfinShow } from './aJellyfinShow';

describe('aJellyfinShow', () => {
  it('is a programme of two seasons unless told otherwise', () => {
    expect(aJellyfinShow().seasons.map((season) => season.seasonNumber)).toEqual([1, 2]);
    expect(aJellyfinShow({ title: 'Lost' }).title).toBe('Lost');
  });
});
