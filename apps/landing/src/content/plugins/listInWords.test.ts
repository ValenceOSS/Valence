import { describe, expect, it } from 'vitest';
import { listInWords } from './listInWords';

describe('listInWords', () => {
  it('says nothing for nothing, and one word alone', () => {
    expect(listInWords([])).toBe('');
    expect(listInWords(['a'])).toBe('a');
  });

  it('joins two with and, and more with commas before the and', () => {
    expect(listInWords(['a', 'b'])).toBe('a and b');
    expect(listInWords(['a', 'b', 'c'])).toBe('a, b and c');
  });
});
