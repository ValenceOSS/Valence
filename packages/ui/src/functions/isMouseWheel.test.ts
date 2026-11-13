import { describe, expect, it } from 'vitest';
import { isMouseWheel } from './isMouseWheel';

describe('isMouseWheel', () => {
  it('knows a wheel turning in lines, or in whole steps straight down', () => {
    expect(isMouseWheel({ deltaMode: 1, deltaX: 0, deltaY: 3 })).toBe(true);
    expect(isMouseWheel({ deltaMode: 0, deltaX: 0, deltaY: 100 })).toBe(true);
  });

  it('knows a trackpad by its small, fractional or sideways amounts', () => {
    expect(isMouseWheel({ deltaMode: 0, deltaX: 0, deltaY: 4 })).toBe(false);
    expect(isMouseWheel({ deltaMode: 0, deltaX: 0, deltaY: 57.5 })).toBe(false);
    expect(isMouseWheel({ deltaMode: 0, deltaX: 3, deltaY: 60 })).toBe(false);
  });
});
