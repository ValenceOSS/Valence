import { describe, expect, it } from 'vitest';
import { isSameBook } from './isSameBook';

describe('isSameBook', () => {
  it('takes a book by its title, whatever an audiobook adds to it', () => {
    expect(isSameBook('The Second Step (Unabridged)', 'The Second Step')).toBe(true);
    expect(isSameBook('the second step', 'The Second Step')).toBe(true);
  });

  it('tells two books apart', () => {
    expect(isSameBook('The Third Step', 'The Second Step')).toBe(false);
  });
});
