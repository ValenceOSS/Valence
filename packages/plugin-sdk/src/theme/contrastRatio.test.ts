import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrastRatio';

describe('contrastRatio', () => {
  it('is 21 for black on white and 1 for a colour on itself', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#3b82f6', '#3b82f6')).toBe(1);
  });

  it('does not care which colour comes first', () => {
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(contrastRatio('#ffffff', '#777777'), 10);
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
  });
});
