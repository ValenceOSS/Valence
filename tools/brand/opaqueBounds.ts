type Bounds = { left: number; top: number; width: number; height: number };

/**
 * Finds the smallest rectangle holding every pixel of a picture that is at least as solid as asked,
 * looking only inside a region of it.
 *
 * @param rgba - The picture, four bytes a pixel.
 * @param width - Its width in pixels.
 * @param region - Where to look.
 * @param threshold - How solid a pixel must be, from 0 to 255.
 * @returns The rectangle, or null when nothing in the region is that solid.
 */
const opaqueBounds = (
  rgba: Uint8Array,
  width: number,
  region: Bounds,
  threshold: number,
): Bounds | null => {
  let left = Infinity;
  let top = Infinity;
  let right = -1;
  let bottom = -1;

  for (let y = region.top; y < region.top + region.height; y += 1) {
    for (let x = region.left; x < region.left + region.width; x += 1) {
      if ((rgba[(y * width + x) * 4 + 3] ?? 0) >= threshold) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
  }

  return right < 0 ? null : { left, top, width: right - left + 1, height: bottom - top + 1 };
};

export type { Bounds };

export { opaqueBounds };
