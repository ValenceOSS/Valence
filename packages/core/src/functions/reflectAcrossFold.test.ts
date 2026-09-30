import { describe, expect, it } from 'vitest';
import { applyMatrix } from './applyMatrix';
import { reflectAcrossFold } from './reflectAcrossFold';

describe('reflectAcrossFold', () => {
  it('lays a point over to the other side of a straight crease', () => {
    const flip = reflectAcrossFold({ at: { x: 80, y: 0 }, normal: { x: -1, y: 0 } });

    expect(applyMatrix(flip, { x: 100, y: 30 })).toEqual({ x: 60, y: 30 });
  });

  it('leaves a point on the crease where it is', () => {
    const flip = reflectAcrossFold({
      at: { x: 50, y: 50 },
      normal: { x: Math.SQRT1_2, y: Math.SQRT1_2 },
    });
    const kept = applyMatrix(flip, { x: 100, y: 0 });

    expect(kept.x).toBeCloseTo(100);
    expect(kept.y).toBeCloseTo(0);
  });
});
