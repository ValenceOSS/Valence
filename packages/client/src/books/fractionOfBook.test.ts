import { describe, expect, it } from 'vitest';
import { fractionOfBook } from './fractionOfBook';
import { placeInBook } from './placeInBook';

describe('fractionOfBook', () => {
  it('says the start of a book is none of the way through', () => {
    expect(fractionOfBook([100, 300], 0, 0)).toBe(0);
  });

  it('weighs the parts by how much they hold', () => {
    expect(fractionOfBook([100, 300], 1, 0)).toBe(0.25);
  });

  it('says the end of the last part is the end of the book', () => {
    expect(fractionOfBook([100, 300], 1, 1)).toBe(1);
  });

  it('is the reverse of placeInBook', () => {
    const { part, within } = placeInBook([120, 80, 400], 0.62);

    expect(fractionOfBook([120, 80, 400], part, within)).toBeCloseTo(0.62);
  });

  it('says nothing of a book with no parts', () => {
    expect(fractionOfBook([], 0, 0.5)).toBe(0);
  });
});
