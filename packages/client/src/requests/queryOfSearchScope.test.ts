import { describe, expect, it } from 'vitest';
import { queryOfSearchScope } from './queryOfSearchScope';

describe('queryOfSearchScope', () => {
  it('narrows to a season, or an episode of it, and to nothing for the whole request', () => {
    expect(queryOfSearchScope({ season: 2, episode: null })).toBe('?season=2');
    expect(queryOfSearchScope({ season: 2, episode: 5 })).toBe('?season=2&episode=5');
    expect(queryOfSearchScope(null)).toBe('');
  });
});
