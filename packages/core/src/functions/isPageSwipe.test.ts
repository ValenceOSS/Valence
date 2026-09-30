import { describe, expect, it } from 'vitest';
import { isPageSwipe } from './isPageSwipe';

describe('isPageSwipe', () => {
  it('waits until the pointer has gone a little way sideways', () => {
    expect(isPageSwipe(12, 0)).toBe(false);
    expect(isPageSwipe(13, 0)).toBe(true);
    expect(isPageSwipe(-13, 0)).toBe(true);
  });

  it('ignores a movement that is not clearly more across than down', () => {
    expect(isPageSwipe(30, 20)).toBe(false);
    expect(isPageSwipe(31, 20)).toBe(true);
  });
});
