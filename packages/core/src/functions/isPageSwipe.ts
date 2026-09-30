import { PAGE_TURN } from '@ValenceCore/tokens/PAGE_TURN';

/**
 * Whether a finger or pointer moving over a page is turning it rather than tapping or scrolling:
 * gone a little way sideways, and clearly more across than down.
 *
 * @param across - How far it has moved sideways, in pixels.
 * @param down - How far it has moved up or down, in pixels.
 * @returns Whether it is a swipe to turn the page.
 */
const isPageSwipe = (across: number, down: number): boolean =>
  Math.abs(across) > PAGE_TURN.startsAfter &&
  Math.abs(across) > Math.abs(down) * PAGE_TURN.moreAcrossThanDown;

export { isPageSwipe };
