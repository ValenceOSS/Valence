import { PAGE_TURN } from '@ValenceCore/tokens/PAGE_TURN';

/**
 * Whether a pointer moving over a page that turns with a curl has taken hold of a corner: gone a
 * little way, and at least partly sideways, since a corner can be pulled off at any angle towards
 * the spine but a hand moving straight up or down is not turning the page.
 *
 * @param across - How far it has moved sideways, in pixels.
 * @param down - How far it has moved up or down, in pixels.
 * @returns Whether it is pulling the page's corner.
 */
const isCurlPull = (across: number, down: number): boolean =>
  Math.hypot(across, down) > PAGE_TURN.startsAfter &&
  Math.abs(across) >= Math.abs(down) * PAGE_TURN.curls.acrossAtLeast;

export { isCurlPull };
