import { describe, expect, it } from 'vitest';
import { EQUALISER_BARS } from './EQUALISER_BARS';

describe('EQUALISER_BARS', () => {
  it('moves each bar within its own height, and back to where it began so the loop is seamless', () => {
    for (const bar of EQUALISER_BARS) {
      expect(bar.heights.every((height) => height > 0 && height <= 1)).toBe(true);
      expect(bar.heights.at(-1)).toBe(bar.heights[0]);
      expect(bar.milliseconds).toBeGreaterThan(0);
    }
  });

  it('rests each bar at a height of its own, so a paused marker is not flat', () => {
    expect(new Set(EQUALISER_BARS.map((bar) => bar.rests)).size).toBe(EQUALISER_BARS.length);
  });
});
