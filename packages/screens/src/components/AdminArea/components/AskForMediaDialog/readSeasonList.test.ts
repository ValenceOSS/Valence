import { describe, expect, it } from 'vitest';
import { readSeasonList } from './readSeasonList';

describe('readSeasonList', () => {
  it('reads seasons apart by commas or spaces, and runs of them', () => {
    expect(readSeasonList('1, 3-5 2')).toEqual([1, 2, 3, 4, 5]);
    expect(readSeasonList(' 0 ')).toEqual([0]);
  });

  it('refuses what is not a list of seasons', () => {
    expect(readSeasonList('')).toBeNull();
    expect(readSeasonList('one')).toBeNull();
    expect(readSeasonList('5-3')).toBeNull();
    expect(readSeasonList('1-999')).toBeNull();
  });
});
