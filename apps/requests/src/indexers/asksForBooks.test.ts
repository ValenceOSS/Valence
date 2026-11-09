import { describe, expect, it } from 'vitest';
import { asksForBooks } from './asksForBooks';

describe('asksForBooks', () => {
  it('asks a book search, an audiobook search and a search typed with nothing to narrow it', () => {
    expect(asksForBooks({ mode: 'book' })).toBe(true);
    expect(asksForBooks({ mode: 'search', categories: [3030] })).toBe(true);
    expect(asksForBooks({ mode: 'search', categories: [7020] })).toBe(true);
    expect(asksForBooks({ mode: 'search' })).toBe(true);
    expect(asksForBooks({ mode: 'search', categories: [] })).toBe(true);
  });

  it('does not ask about an episode, a film or an album', () => {
    expect(asksForBooks({ mode: 'tv' })).toBe(false);
    expect(asksForBooks({ mode: 'movie' })).toBe(false);
    expect(asksForBooks({ mode: 'music' })).toBe(false);
    expect(asksForBooks({ mode: 'search', categories: [5000, 5040] })).toBe(false);
    expect(asksForBooks({ mode: 'search', categories: [3010] })).toBe(false);
  });
});
