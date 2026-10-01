import { describe, expect, it } from 'vitest';
import { isWithinHours } from './isWithinHours';

describe('isWithinHours', () => {
  it('holds the hours from its start up to its end', () => {
    expect([0, 1, 3, 5, 6, 12].map((hour) => isWithinHours(hour, 1, 6))).toEqual([
      false,
      true,
      true,
      true,
      false,
      false,
    ]);
  });

  it('runs past midnight where it ends before it starts', () => {
    expect([21, 22, 23, 0, 1, 2, 12].map((hour) => isWithinHours(hour, 22, 2))).toEqual([
      false,
      true,
      true,
      true,
      true,
      false,
      false,
    ]);
  });

  it('holds the whole day where it starts and ends on the same hour', () => {
    expect(isWithinHours(15, 3, 3)).toBe(true);
  });
});
