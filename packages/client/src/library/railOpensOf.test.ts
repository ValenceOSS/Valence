import { describe, expect, it } from 'vitest';
import { railOpensOf } from './railOpensOf';

describe('railOpensOf', () => {
  it('leads a genre row to the search page narrowed to that genre', () => {
    expect(railOpensOf({ genre: 'Drama', decade: null })).toStrictEqual({
      section: 'search',
      filters: 'genre:Drama',
    });
  });

  it('narrows by both where the row was drawn from a genre in a decade', () => {
    expect(railOpensOf({ genre: 'Drama', decade: 1990 })?.filters).toBe('genre:Drama,decade:1990');
  });

  it('leads a decade row to that decade', () => {
    expect(railOpensOf({ genre: null, decade: 1980 })?.filters).toBe('decade:1980');
  });

  it('leads nowhere from a row drawn from neither', () => {
    expect(railOpensOf({ genre: null, decade: null })).toBeNull();
  });
});
