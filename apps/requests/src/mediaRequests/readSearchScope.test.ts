import { describe, expect, it } from 'vitest';
import { readSearchScope } from './readSearchScope';

describe('readSearchScope', () => {
  it('reads a season, and an episode of it', () => {
    expect(readSearchScope('2', undefined)).toEqual({ season: 2, episode: null });
    expect(readSearchScope('2', '5')).toEqual({ season: 2, episode: 5 });
  });

  it('is nothing for the whole request, or for numbers that are not', () => {
    expect(readSearchScope(undefined, '5')).toBeNull();
    expect(readSearchScope('two', undefined)).toBeNull();
    expect(readSearchScope('2', '-1')).toBeNull();
  });
});
