import { describe, expect, it } from 'vitest';
import { isSeriesPack } from './isSeriesPack';

const BOOK = {
  artistName: 'An Author',
  seriesRequestId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  narrations: [
    {
      asin: 'A',
      narrators: ['A Narrator'],
      runtimeMinutes: 980,
      series: 'A Long Road',
    },
  ],
};

describe('isSeriesPack', () => {
  it('takes a release naming the series as several books', () => {
    expect(isSeriesPack(BOOK, 'An Author - A Long Road Books 1-6 [M4B]')).toBe(true);
    expect(isSeriesPack(BOOK, 'A Long Road (Complete) - An Author')).toBe(true);
  });

  it('takes no single book, and no pack of another series', () => {
    expect(isSeriesPack(BOOK, 'An Author - A Long Road 01 - The First Step')).toBe(false);
    expect(isSeriesPack(BOOK, 'Another Saga Books 1-3')).toBe(false);
    expect(isSeriesPack({ ...BOOK, narrations: [] }, 'A Long Road Books 1-6')).toBe(false);
  });

  it('takes a range of the series only where the book is in it', () => {
    const second = {
      ...BOOK,
      narrations: [
        {
          asin: 'A',
          narrators: ['A Narrator'],
          runtimeMinutes: 980,
          series: 'A Long Road',
          seriesPosition: '2',
        },
      ],
    };

    expect(isSeriesPack(second, 'An Author - A Long Road (01 thru 03)')).toBe(true);
    expect(isSeriesPack(second, 'A Long Road [1-6] - An Author')).toBe(true);
    expect(isSeriesPack(second, 'A Long Road Books 3-6 - An Author')).toBe(false);
  });

  it('takes no pack for a book asked for on its own', () => {
    expect(isSeriesPack({ ...BOOK, seriesRequestId: null }, 'A Long Road Books 1-6')).toBe(false);
  });
});
