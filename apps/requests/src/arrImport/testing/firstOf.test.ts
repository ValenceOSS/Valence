import { describe, expect, it } from 'vitest';
import { firstOf } from './firstOf';

describe('firstOf', () => {
  it('gives the first, and fails where there is none', () => {
    expect(firstOf([2, 3])).toBe(2);
    expect(() => firstOf([])).toThrow(RangeError);
  });
});
