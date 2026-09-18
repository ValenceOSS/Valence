import { describe, expect, it } from 'vitest';
import { placeInBook } from './placeInBook';

describe('placeInBook', () => {
  it('finds the start of a book', () => {
    expect(placeInBook([100, 300], 0)).toEqual({ part: 0, within: 0 });
  });

  it('weighs the parts by how much they hold', () => {
    expect(placeInBook([100, 300], 0.5)).toEqual({ part: 1, within: 1 / 3 });
  });

  it('finds a place inside the first part', () => {
    expect(placeInBook([100, 300], 0.125)).toEqual({ part: 0, within: 0.5 });
  });

  it('finds the end of a book in its last part', () => {
    expect(placeInBook([100, 300], 1)).toEqual({ part: 1, within: 1 });
  });

  it('keeps a place outside the book inside it', () => {
    expect(placeInBook([100, 300], 7)).toEqual({ part: 1, within: 1 });
    expect(placeInBook([100, 300], -1)).toEqual({ part: 0, within: 0 });
  });

  it('weighs parts that say they hold nothing as though they held the same', () => {
    expect(placeInBook([0, 0], 0.75)).toEqual({ part: 1, within: 0.5 });
  });

  it('finds the start of a book with no parts', () => {
    expect(placeInBook([], 0.5)).toEqual({ part: 0, within: 0 });
  });
});
