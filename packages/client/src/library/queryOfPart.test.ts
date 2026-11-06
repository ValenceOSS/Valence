import { describe, expect, it } from 'vitest';
import { queryOfPart } from './queryOfPart';

describe('queryOfPart', () => {
  it('asks for a season’s picture, an episode’s, or the title’s', () => {
    expect(queryOfPart({ season: 2, episode: null })).toBe('?season=2');
    expect(queryOfPart({ season: 2, episode: 5 })).toBe('?season=2&episode=5');
    expect(queryOfPart(undefined)).toBe('');
  });
});
