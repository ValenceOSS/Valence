import { describe, expect, it } from 'vitest';
import { turnOfPageSwipe } from './turnOfPageSwipe';

describe('turnOfPageSwipe', () => {
  it('stays put for a short, slow swipe', () => {
    expect(turnOfPageSwipe(40, 0.3)).toBe(0);
    expect(turnOfPageSwipe(-20, -0.1)).toBe(0);
  });

  it('turns once dragged far enough', () => {
    expect(turnOfPageSwipe(41, 0)).toBe(1);
    expect(turnOfPageSwipe(-41, 0)).toBe(-1);
  });

  it('turns on a flick, whichever way it was dragged', () => {
    expect(turnOfPageSwipe(10, 0.5)).toBe(1);
    expect(turnOfPageSwipe(-10, 0.5)).toBe(-1);
  });
});
