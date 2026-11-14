import { describe, expect, it } from 'vitest';
import { rankForYou } from './rankForYou';
import type { RankForYouOptions } from './rankForYou';
import { vectorsOfTitles } from './vectorsOfTitles';

/**
 * A title's traits from its genres and keywords alone.
 *
 * @param genres - Its genres.
 * @param keywords - Its keywords.
 * @returns The traits.
 */
const aTitle = (genres: string[], keywords: number[] = []) => ({
  genres,
  keywords,
  cast: [],
  crew: [],
});

const VECTORS = vectorsOfTitles(
  new Map([
    ['romance-one', aTitle(['Animation', 'Romance', 'Comedy'], [1, 2])],
    ['romance-two', aTitle(['Animation', 'Romance', 'Comedy'], [1, 2])],
    ['romance-three', aTitle(['Animation', 'Romance', 'Drama'], [1])],
    ['fantasy', aTitle(['Animation', 'Fantasy', 'Adventure'], [3])],
    ['crime', aTitle(['Crime', 'Thriller'], [4])],
    ['space', aTitle(['Science Fiction', 'Drama'], [5])],
  ]),
);

const OPTIONS: RankForYouOptions = {
  vectors: VECTORS,
  weights: new Map([['romance-one', 1]]),
  watchers: new Map(),
  profileId: 'me',
  recommended: new Map(),
  ratings: new Map(),
  leaveOut: new Set(),
  limit: 10,
};

describe('rankForYou', () => {
  it('puts what is most like what was enjoyed first, and leaves out what shares nothing', () => {
    const ranked = rankForYou(OPTIONS);

    expect(ranked[0]).toBe('romance-two');
    expect(ranked).toContain('romance-three');
    expect(ranked).not.toContain('crime');
    expect(ranked).not.toContain('romance-one');
  });

  it('steers away from what was disliked', () => {
    const ranked = rankForYou({
      ...OPTIONS,
      weights: new Map([
        ['romance-one', 1],
        ['space', -1],
      ]),
    });

    expect(ranked.indexOf('romance-three')).toBeGreaterThan(ranked.indexOf('romance-two'));
    expect(ranked).not.toContain('space');
  });

  it('lifts what others who liked the same watched, and what the catalogue recommends', () => {
    const ranked = rankForYou({
      ...OPTIONS,
      watchers: new Map([
        ['romance-one', new Set(['me', 'sam'])],
        ['crime', new Set(['sam'])],
      ]),
      recommended: new Map([['space', 1]]),
    });

    expect(ranked).toContain('crime');
    expect(ranked).toContain('space');
  });

  it('leaves out what it is told to and takes no more than asked', () => {
    expect(rankForYou({ ...OPTIONS, leaveOut: new Set(['romance-two']) })).not.toContain(
      'romance-two',
    );
    expect(rankForYou({ ...OPTIONS, limit: 1 })).toEqual(['romance-two']);
  });

  it('offers what the household watched most to somebody who has watched nothing', () => {
    expect(
      rankForYou({
        ...OPTIONS,
        weights: new Map(),
        watchers: new Map([
          ['crime', new Set(['sam', 'dad'])],
          ['fantasy', new Set(['sam'])],
        ]),
      }).slice(0, 2),
    ).toEqual(['crime', 'fantasy']);
  });
});
