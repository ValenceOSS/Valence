import { useMatchesMedia } from '@ValenceUI/useMatchesMedia';

const BESIDE_FROM = '(min-width: 40rem)';

/**
 * Whether there is room to stand one panel beside another, which is the small breakpoint and nothing
 * more.
 *
 * Asked in script rather than written as a class because the thing it decides is animated, and an
 * animated width is an inline style that no breakpoint can reach. A companion column given
 * `min(26rem, 40vw)` on a phone is 156px of sliver — the row stacks correctly and the width does not
 * follow it.
 *
 * @returns Whether a second panel fits beside the first.
 */
const useRoomBeside = (): boolean => useMatchesMedia(BESIDE_FROM);

export { useRoomBeside };
