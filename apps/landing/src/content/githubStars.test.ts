import { describe, expect, it } from 'vitest';
import { readStarCount } from './githubStars';

describe('readStarCount', () => {
  it('reads the star count out of the repository', () => {
    expect(readStarCount({ stargazers_count: 235 })).toBe(235);
  });
});
