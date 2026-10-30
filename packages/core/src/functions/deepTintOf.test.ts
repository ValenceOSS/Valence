import { describe, expect, it } from 'vitest';
import { channelsOf } from './channelsOf';
import { deepTintOf } from './deepTintOf';

/**
 * The lightness of a colour written as `rgb(…)`, from 0 to 1.
 *
 * @param colour - The colour.
 * @returns Its lightness.
 */
const lightnessOf = (colour: string): number => {
  const [red = 0, green = 0, blue = 0] = channelsOf(colour) ?? [];

  return (Math.max(red, green, blue) + Math.min(red, green, blue)) / 2 / 255;
};

describe('deepTintOf', () => {
  it('sets any colour dark enough to write on', () => {
    expect(lightnessOf(deepTintOf([240, 240, 255]))).toBeCloseTo(0.16, 1);
    expect(lightnessOf(deepTintOf([10, 10, 10]))).toBeCloseTo(0.16, 1);
  });

  it('keeps the hue of a cool colour', () => {
    const [red = 0, green = 0, blue = 0] = channelsOf(deepTintOf([30, 90, 200])) ?? [];

    expect(blue).toBeGreaterThan(red);
    expect(blue).toBeGreaterThan(green);
  });

  it('holds a warm colour near charcoal, so a face does not turn everything brown', () => {
    const [red = 0, , blue = 0] = channelsOf(deepTintOf([200, 120, 60])) ?? [];

    expect(red - blue).toBeLessThan(20);
  });

  it('leaves grey grey', () => {
    expect(deepTintOf([128, 128, 128])).toBe('rgb(41, 41, 41)');
  });
});
