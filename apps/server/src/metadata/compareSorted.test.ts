import { describe, expect, it } from 'vitest';
import { compareSorted } from './compareSorted';

describe('compareSorted', () => {
  it('compares numbers as numbers and words as words', () => {
    expect(compareSorted(9, 10)).toBeLessThan(0);
    expect(compareSorted('b', 'a')).toBeGreaterThan(0);
    expect(compareSorted('a', 'a')).toBe(0);
  });
});
