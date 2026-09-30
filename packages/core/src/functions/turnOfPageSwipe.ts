import { PAGE_TURN } from '@ValenceCore/tokens/PAGE_TURN';

/**
 * Whether a page let go of turns, and which way it was swiped: dragged far enough, or flung fast
 * enough, it turns; otherwise it stays.
 *
 * @param across - How far it was swiped sideways, in pixels, rightwards positive.
 * @param pixelsPerMs - How fast it was moving when let go, in pixels a millisecond.
 * @returns The way it was swiped, left or right, or nowhere where it does not turn.
 */
const turnOfPageSwipe = (across: number, pixelsPerMs: number): -1 | 0 | 1 => {
  if (
    Math.abs(across) <= PAGE_TURN.turnsAfter &&
    Math.abs(pixelsPerMs) <= PAGE_TURN.flingPixelsPerMs
  ) {
    return 0;
  }

  return across < 0 ? -1 : 1;
};

export { turnOfPageSwipe };
