import { describe, expect, it } from 'vitest';
import { applyMatrix } from './applyMatrix';
import { mirrorAcrossSpine } from './mirrorAcrossSpine';

describe('mirrorAcrossSpine', () => {
  it('carries a point on the page to the facing page', () => {
    const leaf = { x: 100, y: 0, width: 100, height: 150, spine: 'left' as const };

    expect(applyMatrix(mirrorAcrossSpine(leaf), { x: 150, y: 20 })).toEqual({ x: 50, y: 20 });
  });

  it('mirrors across the right edge for a page bound there', () => {
    const leaf = { x: 0, y: 0, width: 100, height: 150, spine: 'right' as const };

    expect(applyMatrix(mirrorAcrossSpine(leaf), { x: 50, y: 0 })).toEqual({ x: 150, y: 0 });
  });
});
