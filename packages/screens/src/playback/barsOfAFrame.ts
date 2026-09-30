const DARKEST_PICTURE = 28;

/**
 * Measures the black a film carries inside its own frame — bars above and below, and strips down
 * either side — as a share of the frame's height and width. A line counts as black only where every
 * pixel in it is close to black, so the edge of a dark scene is not mistaken for one. The smaller of
 * each pair is taken for both, since bars come in pairs and a caption sitting in one of them should
 * not tip it.
 *
 * @param pixels - The frame's pixels, four bytes to each: red, green, blue, alpha.
 * @param width - How many pixels wide the frame is.
 * @param height - How many pixels high it is.
 * @returns The share of the height each bar above and below takes, and of the width each side
 *   strip takes, or null where the whole frame is dark and says nothing about where the picture ends.
 */
const barsOfAFrame = (
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): { rows: number; columns: number } | null => {
  const isLit = (x: number, y: number): boolean => {
    const at = (y * width + x) * 4;

    return Math.max(pixels[at] ?? 0, pixels[at + 1] ?? 0, pixels[at + 2] ?? 0) > DARKEST_PICTURE;
  };

  const isBlackRow = (y: number): boolean => {
    for (let x = 0; x < width; x += 1) {
      if (isLit(x, y)) {
        return false;
      }
    }

    return true;
  };

  const isBlackColumn = (x: number): boolean => {
    for (let y = 0; y < height; y += 1) {
      if (isLit(x, y)) {
        return false;
      }
    }

    return true;
  };

  const count = (length: number, isBlack: (at: number) => boolean, isFromEnd: boolean): number => {
    let found = 0;

    while (found < length && isBlack(isFromEnd ? length - 1 - found : found)) {
      found += 1;
    }

    return found;
  };

  const top = count(height, isBlackRow, false);

  if (top === height) {
    return null;
  }

  return {
    rows: Math.min(top, count(height, isBlackRow, true)) / height,
    columns:
      Math.min(count(width, isBlackColumn, false), count(width, isBlackColumn, true)) / width,
  };
};

export { barsOfAFrame };
