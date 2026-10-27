import { describe, expect, it } from 'vitest';
import type { Likeness, TitleKind } from './Likeness';
import { indexLikeness } from './indexLikeness';
import { rankLikeness } from './rankLikeness';

const NOTHING_ALIKE: Likeness = {
  genres: [],
  keywords: [],
  cast: [],
  crew: [],
  recommendations: [],
};

/**
 * Describes a title for a test, alike to nothing but what it is given.
 *
 * @param kind - Film or programme.
 * @param catalogueId - Its catalogue identifier.
 * @param likeness - What it is like.
 * @returns The title.
 */
const aTitle = (kind: TitleKind, catalogueId: string, likeness: Partial<Likeness> = {}) => ({
  kind,
  catalogueId,
  likeness: { ...NOTHING_ALIKE, ...likeness },
});

describe('ranking titles by how like one title they are', () => {
  it('puts what the catalogue recommends first, in the order it recommends them', () => {
    const index = indexLikeness([
      aTitle('film', '1', { recommendations: [3, 2], genres: [18] }),
      aTitle('film', '2'),
      aTitle('film', '3'),
      aTitle('film', '4', { genres: [18] }),
    ]);

    expect(rankLikeness(index, 'film:1').map((one) => one.key)).toEqual([
      'film:3',
      'film:2',
      'film:4',
    ]);
  });

  it('does not read a recommended film as the programme numbered the same', () => {
    const index = indexLikeness([
      aTitle('film', '1', { recommendations: [2] }),
      aTitle('series', '2'),
    ]);

    expect(rankLikeness(index, 'film:1')).toEqual([]);
  });

  it('counts a title that recommends this one back', () => {
    const index = indexLikeness([
      aTitle('film', '1'),
      aTitle('film', '2', { recommendations: [1] }),
    ]);

    expect(rankLikeness(index, 'film:1').map((one) => one.key)).toEqual(['film:2']);
  });

  it('ranks a title sharing a rare keyword above one sharing a common one', () => {
    const index = indexLikeness([
      aTitle('film', '1', { keywords: [100, 200] }),
      aTitle('film', '2', { keywords: [100, 300] }),
      aTitle('film', '3', { keywords: [200, 300] }),
      aTitle('film', '4', { keywords: [100, 400] }),
      aTitle('film', '5', { keywords: [100, 500] }),
    ]);

    expect(rankLikeness(index, 'film:1')[0]?.key).toBe('film:3');
  });

  it('compares a film with a programme by the film genres the programme’s join', () => {
    const index = indexLikeness([
      aTitle('film', '1', { genres: [878, 14] }),
      aTitle('series', '2', { genres: [10765] }),
    ]);

    expect(rankLikeness(index, 'film:1').map((one) => one.key)).toEqual(['series:2']);
  });

  it('counts who made a title and who is in it', () => {
    const index = indexLikeness([
      aTitle('film', '1', { crew: [7], cast: [1, 2, 3] }),
      aTitle('film', '2', { crew: [7] }),
      aTitle('film', '3', { cast: [1, 2] }),
      aTitle('film', '4', { cast: [3] }),
    ]);

    expect(rankLikeness(index, 'film:1').map((one) => one.key)).toEqual(['film:2', 'film:3']);
  });

  it('leaves out a title that shares only a genre among several', () => {
    const index = indexLikeness([
      aTitle('film', '1', { genres: [18, 80, 53] }),
      aTitle('film', '2', { genres: [18, 35] }),
    ]);

    expect(rankLikeness(index, 'film:1')).toEqual([]);
  });

  it('leaves out the title itself and anything it is asked to', () => {
    const index = indexLikeness([
      aTitle('film', '1', { genres: [18] }),
      aTitle('film', '2', { genres: [18] }),
      aTitle('film', '3', { genres: [18] }),
    ]);

    expect(rankLikeness(index, 'film:1', new Set(['film:2'])).map((one) => one.key)).toEqual([
      'film:3',
    ]);
  });

  it('finds nothing like a title it knows nothing of', () => {
    expect(rankLikeness(indexLikeness([aTitle('film', '2')]), 'film:1')).toEqual([]);
  });
});
