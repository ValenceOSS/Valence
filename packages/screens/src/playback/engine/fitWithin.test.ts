import { describe, expect, it } from 'vitest';
import { fitWithin } from '@ValenceScreens/playback/engine/fitWithin';

describe('fitWithin', () => {
  it('puts bars above and below a wide picture', () => {
    expect(fitWithin({ width: 2400, height: 1000 }, { width: 1920, height: 1080 })).toEqual({
      x: 0,
      y: 140,
      width: 1920,
      height: 800,
    });
  });

  it('puts bars on the sides of a narrow picture', () => {
    expect(fitWithin({ width: 1440, height: 1080 }, { width: 1920, height: 1080 })).toEqual({
      x: 240,
      y: 0,
      width: 1440,
      height: 1080,
    });
  });

  it('fills the surface where the picture has no size yet', () => {
    expect(fitWithin({ width: 0, height: 0 }, { width: 800, height: 600 })).toEqual({
      x: 0,
      y: 0,
      width: 800,
      height: 600,
    });
  });
});
