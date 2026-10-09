import { describe, expect, it } from 'vitest';
import { narratorsOf } from './narratorsOf';

describe('narratorsOf', () => {
  it('reads who an audiobook’s tags say reads it, or else who its folder names in braces', () => {
    expect(narratorsOf(['A Reader'], '/books/Author/A Book {Someone Else}')).toEqual(['A Reader']);
    expect(narratorsOf([], '/books/Author/A Book {A Reader, Another}')).toEqual([
      'A Reader',
      'Another',
    ]);
    expect(narratorsOf([], '/books/Author/A Book')).toEqual([]);
  });
});
