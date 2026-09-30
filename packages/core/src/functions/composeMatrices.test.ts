import { describe, expect, it } from 'vitest';
import { applyMatrix } from './applyMatrix';
import { composeMatrices } from './composeMatrices';

describe('composeMatrices', () => {
  it('does the inner matrix first and the outer second', () => {
    const move = [1, 0, 0, 1, 10, 0] as const;
    const double = [2, 0, 0, 2, 0, 0] as const;
    const point = { x: 1, y: 1 };

    expect(applyMatrix(composeMatrices(double, move), point)).toEqual({ x: 22, y: 2 });
    expect(applyMatrix(composeMatrices(move, double), point)).toEqual({ x: 12, y: 2 });
  });
});
