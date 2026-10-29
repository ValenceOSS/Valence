import { describe, expect, it } from 'vitest';
import { readStarCount } from './readStarCount';

describe('readStarCount', () => {
  it('reads the star count out of the repository', () => {
    expect(readStarCount({ stargazers_count: 235 })).toBe(235);
  });

  it('refuses a count that cannot be one', () => {
    expect(() => readStarCount({ stargazers_count: -1 })).toThrow();
    expect(() => readStarCount({ stars: 'many' })).toThrow();
  });
});
