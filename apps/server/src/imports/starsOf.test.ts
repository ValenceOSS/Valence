import { describe, expect, it } from 'vitest';
import { starsOf } from './starsOf';

describe('starsOf', () => {
  it('halves a rating out of ten into one to five stars', () => {
    expect(starsOf(10)).toBe(5);
    expect(starsOf(9)).toBe(5);
    expect(starsOf(7)).toBe(4);
    expect(starsOf(1)).toBe(1);
    expect(starsOf(0.5)).toBe(1);
  });

  it('has no stars for no rating', () => {
    expect(starsOf(null)).toBeNull();
    expect(starsOf(0)).toBeNull();
    expect(starsOf(Number.NaN)).toBeNull();
  });
});
