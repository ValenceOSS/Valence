import { describe, expect, it } from 'vitest';
import { nameSearchScope } from './nameSearchScope';

describe('nameSearchScope', () => {
  it('names a season by its name and an episode as release names write it', () => {
    expect(nameSearchScope({ season: 1, episode: null })).toBe('Season 1');
    expect(nameSearchScope({ season: 2, episode: 5 })).toBe('S02E05');
  });
});
