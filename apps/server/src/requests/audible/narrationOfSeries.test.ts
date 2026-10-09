import { describe, expect, it } from 'vitest';
import { narrationOfSeries } from './narrationOfSeries';

const A = { asin: 'A', narrators: ['Ann Reader'], runtimeMinutes: 600, series: 'A Series' };

const B = { asin: 'B', narrators: ['Bob Voice'], runtimeMinutes: 610, series: 'A Series' };

describe('narrationOfSeries', () => {
  it('takes the only narration, or the one the library’s series is read by', () => {
    expect(narrationOfSeries([A], [])).toBe('A');
    expect(narrationOfSeries([A, B], ['bob voice'])).toBe('B');
  });

  it('leaves the choice where the library reads the series in neither, or both', () => {
    expect(narrationOfSeries([A, B], [])).toBeNull();
    expect(narrationOfSeries([A, B], ['Ann Reader', 'Bob Voice'])).toBeNull();
    expect(narrationOfSeries([], ['Ann Reader'])).toBeNull();
  });
});
