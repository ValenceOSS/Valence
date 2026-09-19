import { describe, expect, it } from 'vitest';
import { SIZE_STEPS, positionOf, sizeAt } from './sizeScale';

describe('sizeScale', () => {
  it('stands for no limit at either end', () => {
    expect(sizeAt(0)).toBeNull();
    expect(sizeAt(SIZE_STEPS)).toBeNull();
    expect(positionOf(null, 'smallest')).toBe(0);
    expect(positionOf(null, 'largest')).toBe(SIZE_STEPS);
  });

  it('spreads the sizes most qualities sit at across the track', () => {
    expect(sizeAt(28)).toBe(784);
    expect(sizeAt(100)).toBe(10_000);
    expect(positionOf(750, 'smallest')).toBe(27);
    expect(positionOf(10_000, 'largest')).toBe(100);
  });

  it('keeps a size inside the track, off its ends', () => {
    expect(positionOf(0.001, 'smallest')).toBe(1);
    expect(positionOf(1_000_000, 'largest')).toBe(SIZE_STEPS - 1);
  });
});
