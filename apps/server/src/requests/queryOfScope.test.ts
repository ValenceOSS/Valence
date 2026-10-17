import { describe, expect, it } from 'vitest';
import { queryOfScope } from './queryOfScope';

describe('queryOfScope', () => {
  it('narrows to a season, or an episode of it', () => {
    expect(queryOfScope({ season: '1' })).toBe('?season=1');
    expect(queryOfScope({ season: '1', episode: '3' })).toBe('?season=1&episode=3');
  });

  it('narrows to some indexers, with or without a season', () => {
    expect(queryOfScope({ indexers: 'a,b' })).toBe('?indexers=a%2Cb');
    expect(queryOfScope({ season: '1', indexers: 'a' })).toBe('?season=1&indexers=a');
  });

  it('says nothing for the whole request, or an episode with no season', () => {
    expect(queryOfScope({})).toBe('');
    expect(queryOfScope({ episode: '3' })).toBe('');
  });
});
