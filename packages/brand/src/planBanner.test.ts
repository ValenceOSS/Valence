import { describe, expect, it } from 'vitest';
import { planBanner } from './planBanner';

const LOGO = { left: 400, top: 560, width: 1248, height: 916 };

describe('planBanner', () => {
  it('takes a band from the middle of the icon in the picture’s own shape', () => {
    const plan = planBanner(1280, 768, 0.42, 2048, LOGO);

    expect(plan.background).toEqual({ left: 205, top: 533, width: 1638, height: 983 });
    expect(plan.background.width / plan.background.height).toBeCloseTo(1280 / 768, 2);
    expect(plan.logoHeight).toBe(323);
  });

  it('lifts room around the logo for its shadow, without leaving the render', () => {
    expect(planBanner(1920, 720, 0.3, 2048, LOGO).artwork).toEqual({
      left: 171,
      top: 331,
      width: 1706,
      height: 1374,
    });
    expect(
      planBanner(1920, 720, 0.3, 2048, { left: 10, top: 10, width: 2000, height: 2000 }).artwork,
    ).toEqual({ left: 0, top: 0, width: 2048, height: 2048 });
  });
});
