import { describe, expect, it } from 'vitest';
import { opaqueBounds } from './opaqueBounds';

const picture = (width: number, height: number, solid: [number, number, number][]) => {
  const rgba = new Uint8Array(width * height * 4);

  for (const [x, y, alpha] of solid) {
    rgba[(y * width + x) * 4 + 3] = alpha;
  }

  return rgba;
};

describe('opaqueBounds', () => {
  it('finds the solid pixels inside the region, ignoring faint ones and those outside it', () => {
    const rgba = picture(6, 6, [
      [2, 1, 255],
      [4, 3, 200],
      [3, 4, 40],
      [0, 0, 255],
    ]);

    expect(opaqueBounds(rgba, 6, { left: 1, top: 1, width: 5, height: 5 }, 128)).toEqual({
      left: 2,
      top: 1,
      width: 3,
      height: 3,
    });
  });

  it('says so when nothing there is solid', () => {
    expect(
      opaqueBounds(picture(4, 4, [[1, 1, 60]]), 4, { left: 0, top: 0, width: 4, height: 4 }, 128),
    ).toBeNull();
  });
});
