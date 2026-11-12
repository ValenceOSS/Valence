import { frameWindow } from './frameWindow';
import type { PictureFrame } from './PictureFrame';

/**
 * Where a picture is drawn in a box of its frame's shape so the box shows the part its frame chose,
 * as shares of the box: how far its left and top edges sit from the box's, which is less than none
 * where the picture runs past it, and how wide and tall it is drawn.
 *
 * @param picture - How wide and tall the picture is.
 * @param aspect - How wide the box is for its height.
 * @param frame - Where the picture sits, or nothing for its middle.
 * @returns Where it is drawn.
 */
const placedPicture = (
  picture: { width: number; height: number },
  aspect: number,
  frame: PictureFrame | null,
): { left: number; top: number; width: number; height: number } => {
  const seen = frameWindow(picture.width, picture.height, aspect, frame);

  return {
    left: -seen.left / seen.width,
    top: -seen.top / seen.height,
    width: picture.width / seen.width,
    height: picture.height / seen.height,
  };
};

export { placedPicture };
