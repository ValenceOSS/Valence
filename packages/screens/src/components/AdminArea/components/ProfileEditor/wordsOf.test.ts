import { describe, expect, it } from 'vitest';
import { wordsOf } from './wordsOf';

describe('wordsOf', () => {
  it('splits words at commas, trimming each and dropping the empty ones', () => {
    expect(wordsOf('HDR, Atmos, , /\\bdv\\b/')).toEqual(['HDR', 'Atmos', '/\\bdv\\b/']);
  });

  it('answers no words for nothing typed', () => {
    expect(wordsOf('')).toEqual([]);
  });
});
