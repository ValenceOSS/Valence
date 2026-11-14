import { describe, expect, it } from 'vitest';
import { shareOfPeak } from './shareOfPeak';

describe('shareOfPeak', () => {
  it('draws the busiest moment at the top and the rest against it', () => {
    expect(shareOfPeak(4_000_000, 4_000_000)).toBe(100);
    expect(shareOfPeak(1_000_000, 4_000_000)).toBe(25);
  });

  it('leaves a gap, never a zero, where the rate is unknown', () => {
    expect(shareOfPeak(null, 4_000_000)).toBeNull();
    expect(shareOfPeak(undefined, 4_000_000)).toBeNull();
  });

  it('draws a quiet network along the bottom', () => {
    expect(shareOfPeak(0, 0)).toBe(0);
  });
});
