import { describe, expect, it } from 'vitest';
import { narrationOfSeriesBook } from './narrationOfSeriesBook';

const narration = (asin: string, narrators: string[]) => ({
  asin,
  narrators,
  runtimeMinutes: 600,
  series: null,
});

const BOOK = { narrations: [narration('A', ['Ann']), narration('B', ['Bob', 'Cat'])] };

describe('narrationOfSeriesBook', () => {
  it('takes the only narration', () => {
    expect(narrationOfSeriesBook({ narrations: [narration('A', ['Ann'])] }, [], [], false)).toBe(
      'A',
    );
  });

  it('takes the one read by whoever reads the series in the library', () => {
    expect(narrationOfSeriesBook(BOOK, ['cat'], [], false)).toBe('B');
  });

  it('keeps the readers already chosen for the series, where it keeps one narrator', () => {
    expect(narrationOfSeriesBook(BOOK, [], [['Cat', 'Bob']], true)).toBe('B');
    expect(narrationOfSeriesBook(BOOK, [], [['Cat', 'Bob']], false)).toBeNull();
  });

  it('leaves the choice to somebody where nothing settles it', () => {
    expect(narrationOfSeriesBook(BOOK, [], [], true)).toBeNull();
    expect(narrationOfSeriesBook({ narrations: [] }, [], [], true)).toBeNull();
  });
});
