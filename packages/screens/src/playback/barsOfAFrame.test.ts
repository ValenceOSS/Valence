import { describe, expect, it } from 'vitest';
import { barsOfAFrame } from './barsOfAFrame';

const WIDTH = 10;

const HEIGHT = 10;

/**
 * Paints a frame black outside a lit rectangle.
 *
 * @param lit - The rows and columns the picture covers, ends included.
 * @returns The frame's pixels.
 */
const framed = (lit: { top: number; bottom: number; left: number; right: number }) => {
  const pixels = new Uint8ClampedArray(WIDTH * HEIGHT * 4);

  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const isLit = y >= lit.top && y <= lit.bottom && x >= lit.left && x <= lit.right;

      pixels.set(isLit ? [200, 180, 160, 255] : [0, 0, 0, 255], (y * WIDTH + x) * 4);
    }
  }

  return pixels;
};

describe('barsOfAFrame', () => {
  it('measures the bars above and below a letterboxed film', () => {
    expect(barsOfAFrame(framed({ top: 2, bottom: 7, left: 0, right: 9 }), WIDTH, HEIGHT)).toEqual({
      rows: 0.2,
      columns: 0,
    });
  });

  it('measures strips down either side', () => {
    expect(barsOfAFrame(framed({ top: 0, bottom: 9, left: 1, right: 8 }), WIDTH, HEIGHT)).toEqual({
      rows: 0,
      columns: 0.1,
    });
  });

  it('takes the thinner of a pair, so a caption in one bar does not tip it', () => {
    expect(
      barsOfAFrame(framed({ top: 3, bottom: 8, left: 0, right: 9 }), WIDTH, HEIGHT)?.rows,
    ).toBe(0.1);
  });

  it('says nothing about a frame that is dark all over', () => {
    expect(barsOfAFrame(new Uint8ClampedArray(WIDTH * HEIGHT * 4), WIDTH, HEIGHT)).toBeNull();
  });
});
