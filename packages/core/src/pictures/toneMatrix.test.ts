import { describe, expect, it } from 'vitest';
import { toneMatrix } from './toneMatrix';

const AS_IT_IS = { saturate: 1, hueRotate: 0, contrast: 1, brightness: 1, layer: null };

const through = (matrix: number[], [red, green, blue]: [number, number, number]) =>
  [0, 1, 2].map((row) => {
    const at = row * 5;

    return (
      (matrix[at] ?? 0) * red +
      (matrix[at + 1] ?? 0) * green +
      (matrix[at + 2] ?? 0) * blue +
      (matrix[at + 4] ?? 0)
    );
  });

describe('toneMatrix', () => {
  it('leaves a picture as it is where the tone changes nothing', () => {
    const matrix = toneMatrix(AS_IT_IS);

    expect(through(matrix, [0.2, 0.5, 0.9]).map((value) => Number(value.toFixed(6)))).toEqual([
      0.2, 0.5, 0.9,
    ]);
    expect(matrix.slice(15)).toEqual([0, 0, 0, 1, 0]);
  });

  it('turns every colour to its grey where nothing of the colour is kept', () => {
    const [red, green, blue] = through(toneMatrix({ ...AS_IT_IS, saturate: 0 }), [1, 0, 0]);

    expect(red).toBeCloseTo(0.213);
    expect(green).toBeCloseTo(0.213);
    expect(blue).toBeCloseTo(0.213);
  });

  it('pushes colours apart from the middle grey as contrast rises, and darkens with brightness', () => {
    expect(through(toneMatrix({ ...AS_IT_IS, contrast: 2 }), [0.75, 0.5, 0.25])).toEqual([
      1, 0.5, 0,
    ]);
    expect(through(toneMatrix({ ...AS_IT_IS, brightness: 0.5 }), [1, 1, 1])).toEqual([
      0.5, 0.5, 0.5,
    ]);
  });

  it('turns colours round the wheel, keeping a grey grey', () => {
    const matrix = toneMatrix({ ...AS_IT_IS, hueRotate: 180 });
    const [red, green, blue] = through(matrix, [0.5, 0.5, 0.5]);

    expect(red).toBeCloseTo(0.5);
    expect(green).toBeCloseTo(0.5);
    expect(blue).toBeCloseTo(0.5);
    expect(through(matrix, [1, 0, 0])[0]).toBeLessThan(0.5);
  });
});
