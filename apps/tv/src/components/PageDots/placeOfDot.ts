import { PAGE_DOT } from '@ValenceTv/components/PageDots/PAGE_DOT';

/**
 * Where a page dot sits in its row and how wide it is: the current one a longer pill, and every
 * dot after it moved along to make room.
 *
 * @param at - Which dot, from nought.
 * @param current - Which turn is now, from nought.
 * @returns Its left edge and its width.
 */
const placeOfDot = (at: number, current: number): { x: number; width: number } => ({
  x:
    at * (PAGE_DOT.size + PAGE_DOT.gap) +
    (at > current ? PAGE_DOT.currentWidth - PAGE_DOT.size : 0),
  width: at === current ? PAGE_DOT.currentWidth : PAGE_DOT.size,
});

export { placeOfDot };
