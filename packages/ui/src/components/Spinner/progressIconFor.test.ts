import {
  CircleDashed as CircleDashedIcon,
  CircleDashedFull as CircleDashedFullIcon,
  CircleDashedHalf as CircleDashedHalfIcon,
  CircleDashedQuarter as CircleDashedQuarterIcon,
  CircleDashedThreeQuarter as CircleDashedThreeQuarterIcon,
} from '@keyline-icons/react';
import { describe, expect, it } from 'vitest';
import { progressIconFor } from './progressIconFor';

describe('progressIconFor', () => {
  it.each([
    [0, CircleDashedIcon],
    [0.24, CircleDashedIcon],
    [0.25, CircleDashedQuarterIcon],
    [0.5, CircleDashedHalfIcon],
    [0.75, CircleDashedThreeQuarterIcon],
    [0.99, CircleDashedThreeQuarterIcon],
    [1, CircleDashedFullIcon],
  ])('draws %s done as the matching quarter of the ring', (progress, icon) => {
    expect(progressIconFor(progress)).toBe(icon);
  });

  it('draws the whole ring for anything past done', () => {
    expect(progressIconFor(1.5)).toBe(CircleDashedFullIcon);
  });
});
