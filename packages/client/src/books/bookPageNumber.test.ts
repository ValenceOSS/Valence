import { describe, expect, it } from 'vitest';
import { bookPageNumber } from './bookPageNumber';

describe('bookPageNumber', () => {
  it('numbers the first part from one', () => {
    expect(bookPageNumber([100, 300], 0, 10, 0)).toBe(1);
    expect(bookPageNumber([100, 300], 0, 10, 9)).toBe(10);
  });

  it('counts on from the pages the parts before would make', () => {
    expect(bookPageNumber([100, 100, 200], 1, 10, 0)).toBe(11);
    expect(bookPageNumber([100, 100, 200], 2, 20, 4)).toBe(25);
  });

  it('numbers from one where the parts say nothing of their size', () => {
    expect(bookPageNumber([], 0, 5, 2)).toBe(3);
  });
});
