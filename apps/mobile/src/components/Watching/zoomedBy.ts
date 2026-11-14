import type { ABox } from '@ValenceMobile/components/Watching/howBigToDrawIt';
import type { AFrame } from '@ValenceMobile/components/Watching/fittedTo';

/**
 * Where a film's frame ends up on the screen once it is pinched larger, which grows it about the
 * middle of the screen, so whatever is drawn over a point in the picture can follow it there.
 *
 * @param frame - Where the frame is drawn before it is grown.
 * @param screen - The space it is drawn in.
 * @param by - How many times larger it is drawn, which is one while it is fitted.
 * @returns Where the frame is drawn once grown.
 */
const zoomedBy = (frame: AFrame, screen: ABox, by: number): AFrame => ({
  left: screen.width / 2 + (frame.left - screen.width / 2) * by,
  top: screen.height / 2 + (frame.top - screen.height / 2) * by,
  width: frame.width * by,
  height: frame.height * by,
});

export { zoomedBy };
