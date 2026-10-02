import { describe, expect, it } from 'vitest';
import { allowedRatingNames } from './allowedRatingNames';

const TABLE = [
  { name: 'G', score: 0, subScore: null },
  { name: 'PG-13', score: 13, subScore: null },
  { name: 'R', score: 17, subScore: 0 },
  { name: 'NC-17', score: 17, subScore: 1 },
  { name: 'Unknown', score: null, subScore: null },
];

describe('allowedRatingNames', () => {
  it('lets through everything at or below the limit', () => {
    expect(allowedRatingNames(TABLE, 13, null)).toEqual(['G', 'PG-13']);
  });

  it('splits one age by its sub-score where the server has one', () => {
    expect(allowedRatingNames(TABLE, 17, 0)).toEqual(['G', 'PG-13', 'R']);
    expect(allowedRatingNames(TABLE, 17, null)).toEqual(['G', 'PG-13', 'R', 'NC-17']);
  });
});
