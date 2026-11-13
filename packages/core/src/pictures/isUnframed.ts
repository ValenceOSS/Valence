import type { PictureFrame } from '@ValenceCore/pictures/PictureFrame';

/**
 * Whether a picture sits where it starts: in the middle of its shape, drawn no nearer than the
 * whole shape allows, so there is nothing to put back.
 *
 * @param frame - Where it sits.
 * @returns Whether it is where it starts.
 */
const isUnframed = (frame: PictureFrame): boolean =>
  frame.zoom === 1 && frame.x === 0 && frame.y === 0;

export { isUnframed };
