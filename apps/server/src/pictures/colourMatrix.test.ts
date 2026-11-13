import { describe, expect, it } from 'vitest';
import { colourMatrix } from './colourMatrix';

const rounded = (matrix: number[][]) => matrix.map((row) => row.map((at) => Number(at.toFixed(3))));

describe('colourMatrix', () => {
  it('leaves colours as they are when nothing is asked of it', () => {
    expect(rounded(colourMatrix(1, 0))).toEqual([
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]);
  });

  it('turns every colour to its grey, each channel the same', () => {
    const [red, green, blue] = colourMatrix(0, 0);

    expect(red).toEqual(green);
    expect(green).toEqual(blue);
  });

  it('swings red round towards cyan when turned halfway round the colour wheel', () => {
    const [toRed, toGreen, toBlue] = colourMatrix(1, 180);

    expect(toRed[0]).toBeLessThan(toGreen[0]);
    expect(toRed[0]).toBeLessThan(toBlue[0]);
  });
});
