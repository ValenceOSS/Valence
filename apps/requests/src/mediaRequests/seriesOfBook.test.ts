import { describe, expect, it } from 'vitest';
import { seriesOfBook } from './seriesOfBook';

const NARRATIONS = [
  { asin: 'A', narrators: ['Somebody'], runtimeMinutes: 600, series: null },
  { asin: 'B', narrators: ['Somebody Else'], runtimeMinutes: 610, series: 'A Long Road' },
];

describe('seriesOfBook', () => {
  it('names the series a book was asked for as part of', () => {
    expect(
      seriesOfBook({
        narrations: NARRATIONS,
        seriesRequestId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      }),
    ).toBe('A Long Road');
  });

  it('names none for a book asked for on its own, or one no narration places', () => {
    expect(seriesOfBook({ narrations: NARRATIONS, seriesRequestId: null })).toBeNull();
    expect(
      seriesOfBook({ narrations: [], seriesRequestId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' }),
    ).toBeNull();
  });
});
