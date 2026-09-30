import { describe, expect, it } from 'vitest';
import { applyMatrix } from './applyMatrix';

describe('applyMatrix', () => {
  it('leaves a point where it is under the identity', () => {
    expect(applyMatrix([1, 0, 0, 1, 0, 0], { x: 3, y: 4 })).toEqual({ x: 3, y: 4 });
  });

  it('scales and moves a point', () => {
    expect(applyMatrix([2, 0, 0, 3, 10, 20], { x: 1, y: 1 })).toEqual({ x: 12, y: 23 });
  });
});
