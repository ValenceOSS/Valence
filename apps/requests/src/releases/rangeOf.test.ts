import { describe, expect, it } from 'vitest';
import { rangeOf } from './rangeOf';

describe('rangeOf', () => {
  it('counts from one end to the other, whichever way round', () => {
    expect(rangeOf(3, 5)).toEqual([3, 4, 5]);
    expect(rangeOf(5, 3)).toEqual([3, 4, 5]);
    expect(rangeOf(7, 7)).toEqual([7]);
  });
});
