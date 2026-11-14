import { describe, expect, it } from 'vitest';
import { dotOf } from './dotOf';
import { vectorsOfTitles } from './vectorsOfTitles';

const NOTHING = { keywords: [], cast: [], crew: [] };

describe('vectorsOfTitles', () => {
  it('gives each title a unit vector of its features', () => {
    const vectors = vectorsOfTitles(
      new Map([
        ['one', { genres: ['Drama'], keywords: [1], cast: [7], crew: [9] }],
        ['two', { genres: ['Comedy'], ...NOTHING }],
      ]),
    );
    const one = vectors.get('one') ?? new Map<string, number>();

    expect([...one.keys()].toSorted()).toEqual(['cast:7', 'crew:9', 'genre:drama', 'keyword:1']);
    expect(dotOf(one, one)).toBeCloseTo(1);
  });

  it('makes sharing a rare feature count for more than sharing a common one', () => {
    const vectors = vectorsOfTitles(
      new Map([
        ['source', { genres: ['Drama', 'Noir'], ...NOTHING }],
        ['common', { genres: ['Drama'], ...NOTHING }],
        ['rare', { genres: ['Noir'], ...NOTHING }],
        ['other', { genres: ['Drama'], ...NOTHING }],
      ]),
    );
    const source = vectors.get('source') ?? new Map<string, number>();

    expect(dotOf(source, vectors.get('rare') ?? new Map())).toBeGreaterThan(
      dotOf(source, vectors.get('common') ?? new Map()),
    );
  });

  it('counts only the first of the cast', () => {
    const vectors = vectorsOfTitles(
      new Map([['one', { genres: [], keywords: [], cast: [1, 2, 3, 4, 5, 6, 7, 8], crew: [] }]]),
    );

    expect(vectors.get('one')?.has('cast:6')).toBe(true);
    expect(vectors.get('one')?.has('cast:7')).toBe(false);
  });
});
