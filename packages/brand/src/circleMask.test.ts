import { describe, expect, it } from 'vitest';
import { circleMask } from './circleMask';

/**
 * How opaque one pixel of a mask is.
 *
 * @param mask - The mask.
 * @param pixels - Its width.
 * @param x - The column.
 * @param y - The row.
 * @returns Its alpha, 0 to 255.
 */
const alphaAt = (mask: Buffer, pixels: number, x: number, y: number): number =>
  mask[(y * pixels + x) * 4 + 3] ?? -1;

describe('circleMask', () => {
  it('fills the middle and leaves the corners empty', () => {
    const mask = circleMask(64);

    expect(mask).toHaveLength(64 * 64 * 4);
    expect(alphaAt(mask, 64, 32, 32)).toBe(255);
    expect(alphaAt(mask, 64, 0, 0)).toBe(0);
    expect(alphaAt(mask, 64, 63, 63)).toBe(0);
  });

  it('reaches the middle of each edge', () => {
    const mask = circleMask(64);

    expect(alphaAt(mask, 64, 32, 0)).toBeGreaterThan(0);
    expect(alphaAt(mask, 64, 0, 32)).toBeGreaterThan(0);
  });
});
