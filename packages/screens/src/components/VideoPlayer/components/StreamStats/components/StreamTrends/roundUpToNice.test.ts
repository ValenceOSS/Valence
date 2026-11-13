import { describe, expect, it } from 'vitest';
import { roundUpToNice } from './roundUpToNice';

describe('roundUpToNice', () => {
  it('rounds up to the next 1, 2 or 5 of its power of ten', () => {
    expect(roundUpToNice(14_534)).toBe(20_000);
    expect(roundUpToNice(42)).toBe(50);
    expect(roundUpToNice(95_000)).toBe(100_000);
  });

  it('leaves a figure that is already round alone', () => {
    expect(roundUpToNice(500)).toBe(500);
  });

  it('never goes below one', () => {
    expect(roundUpToNice(0)).toBe(1);
    expect(roundUpToNice(Number.NaN)).toBe(1);
  });
});
