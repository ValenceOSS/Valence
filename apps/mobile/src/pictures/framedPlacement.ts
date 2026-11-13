import type { PictureFrame } from '@ValenceCore/pictures/PictureFrame';
import { placedPicture } from '@ValenceCore/pictures/placedPicture';

const UNFRAMED = { zoom: 1, x: 0, y: 0 };

/**
 * Where a picture is drawn in a box so the box shows the part its frame chose: laid out where it
 * would sit unmoved, then shifted and scaled there. Moving or zooming it then changes only how it is
 * shifted and scaled, which the phone does without laying the picture out or scaling it afresh.
 *
 * @param picture - How large the picture is.
 * @param aspect - How wide the box is for its height.
 * @param frame - Where it sits.
 * @param box - How large the box is drawn.
 * @returns How to place it.
 */
const framedPlacement = (
  picture: { width: number; height: number },
  aspect: number,
  frame: PictureFrame,
  box: { width: number; height: number },
): {
  position: 'absolute';
  left: number;
  top: number;
  width: number;
  height: number;
  transform: [{ translateX: number }, { translateY: number }, { scale: number }];
} => {
  const unmoved = placedPicture(picture, aspect, UNFRAMED);
  const now = placedPicture(picture, aspect, frame);
  const middle = (at: { left: number; top: number; width: number; height: number }) => ({
    x: (at.left + at.width / 2) * box.width,
    y: (at.top + at.height / 2) * box.height,
  });
  const from = middle(unmoved);
  const to = middle(now);

  return {
    position: 'absolute',
    left: unmoved.left * box.width,
    top: unmoved.top * box.height,
    width: unmoved.width * box.width,
    height: unmoved.height * box.height,
    transform: [
      { translateX: to.x - from.x },
      { translateY: to.y - from.y },
      { scale: now.width / unmoved.width },
    ],
  };
};

export { framedPlacement };
