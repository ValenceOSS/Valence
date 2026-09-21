import { describe, expect, it } from 'vitest';
import { SWING_DEGREES, pageFlipVariants, swingOf } from './pageFlip';

const LEFT_TO_RIGHT = { isRightToLeft: false };
const RIGHT_TO_LEFT = { isRightToLeft: true };

describe('swingOf', () => {
  it('hinges a book read left to right at its left, and swings the page over to the left', () => {
    expect(swingOf({ ...LEFT_TO_RIGHT, isAdvancing: true })).toEqual({
      angle: -SWING_DEGREES,
      hinge: 'left center',
    });
  });

  it('mirrors it for a book read right to left', () => {
    expect(swingOf({ ...RIGHT_TO_LEFT, isAdvancing: true })).toEqual({
      angle: SWING_DEGREES,
      hinge: 'right center',
    });
  });
});

describe('pageFlipVariants', () => {
  it('swings the spread being left over the one arriving, going on', () => {
    const going = { ...LEFT_TO_RIGHT, isAdvancing: true };

    expect(pageFlipVariants.leave(going)).toMatchObject({ rotateY: -SWING_DEGREES, zIndex: 2 });
    expect(pageFlipVariants.enter(going)).toMatchObject({ rotateY: 0, zIndex: 1 });
  });

  it('swings the spread being returned to down over the one leaving, going back', () => {
    const coming = { ...LEFT_TO_RIGHT, isAdvancing: false };

    expect(pageFlipVariants.enter(coming)).toMatchObject({ rotateY: -SWING_DEGREES, zIndex: 2 });
    expect(pageFlipVariants.settled(coming)).toMatchObject({ rotateY: 0, zIndex: 2 });
    expect(pageFlipVariants.leave(coming)).toMatchObject({ rotateY: 0, zIndex: 1 });
  });

  it('darkens a page as it turns edge-on and lights it once it lies flat', () => {
    const going = { ...LEFT_TO_RIGHT, isAdvancing: true };

    expect(pageFlipVariants.leave(going).filter).toBe('brightness(0.55)');
    expect(pageFlipVariants.settled(going).filter).toBe('brightness(1)');
  });
});
