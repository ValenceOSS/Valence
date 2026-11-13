import { describe, expect, it } from 'vitest';
import { toneFilter } from './toneFilter';

describe('toneFilter', () => {
  it('draws a tone’s adjustments in one fixed order', () => {
    expect(
      toneFilter({ saturate: 0, hueRotate: 90, contrast: 1.1, brightness: 1.05, layer: null }),
    ).toBe('saturate(0) hue-rotate(90deg) contrast(1.1) brightness(1.05)');
  });

  it('draws no filter for a tone that changes nothing', () => {
    expect(
      toneFilter({ saturate: 1, hueRotate: 0, contrast: 1, brightness: 1, layer: null }),
    ).toBeUndefined();
  });
});
