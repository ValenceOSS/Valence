import { describe, expect, it } from 'vitest';
import { isSameBook } from './isSameBook';

describe('isSameBook', () => {
  it('takes a book by its title, whatever an audiobook adds to it', () => {
    expect(isSameBook('Golden Son (Unabridged)', 'Golden Son')).toBe(true);
    expect(isSameBook('golden son', 'Golden Son')).toBe(true);
  });

  it('tells two books apart', () => {
    expect(isSameBook('Morning Star', 'Golden Son')).toBe(false);
  });
});
