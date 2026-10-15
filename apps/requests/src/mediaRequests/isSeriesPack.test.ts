import { describe, expect, it } from 'vitest';
import { isSeriesPack } from './isSeriesPack';

const BOOK = {
  artistName: 'Pierce Brown',
  seriesRequestId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  narrations: [
    {
      asin: 'A',
      narrators: ['Tim Gerard Reynolds'],
      runtimeMinutes: 980,
      series: 'Red Rising Saga',
    },
  ],
};

describe('isSeriesPack', () => {
  it('takes a release naming the series as several books', () => {
    expect(isSeriesPack(BOOK, 'Pierce Brown - Red Rising Saga Books 1-6 [M4B]')).toBe(true);
    expect(isSeriesPack(BOOK, 'Red Rising Saga (Complete) - Pierce Brown')).toBe(true);
  });

  it('takes no single book, and no pack of another series', () => {
    expect(isSeriesPack(BOOK, 'Pierce Brown - Red Rising Saga 01 - Red Rising')).toBe(false);
    expect(isSeriesPack(BOOK, 'Another Saga Books 1-3')).toBe(false);
    expect(isSeriesPack({ ...BOOK, narrations: [] }, 'Red Rising Saga Books 1-6')).toBe(false);
  });

  it('takes a range of the series only where the book is in it', () => {
    const second = {
      ...BOOK,
      narrations: [
        {
          asin: 'A',
          narrators: ['Tim Gerard Reynolds'],
          runtimeMinutes: 980,
          series: 'Red Rising Saga',
          seriesPosition: '2',
        },
      ],
    };

    expect(isSeriesPack(second, 'Pierce Brown - Red Rising Saga (01 thru 03)')).toBe(true);
    expect(isSeriesPack(second, 'Red Rising Saga [1-6] - Pierce Brown')).toBe(true);
    expect(isSeriesPack(second, 'Red Rising Saga Books 3-6 - Pierce Brown')).toBe(false);
  });

  it('takes no pack for a book asked for on its own', () => {
    expect(isSeriesPack({ ...BOOK, seriesRequestId: null }, 'Red Rising Saga Books 1-6')).toBe(
      false,
    );
  });
});
