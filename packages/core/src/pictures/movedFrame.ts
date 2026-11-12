import { frameWindow } from './frameWindow';
import type { PictureFrame } from './PictureFrame';

/**
 * Where a picture sits once it is dragged, by a share of the window it is seen through: dragging it
 * right brings more of its left side into view. It goes no further than its edges.
 *
 * @param frame - Where it sits now.
 * @param by - How far it was dragged, as a share of the window's width and height.
 * @param picture - How wide and tall the picture is.
 * @param aspect - How wide the window is for its height.
 * @returns Where it sits now.
 */
const movedFrame = (
  frame: PictureFrame,
  by: { x: number; y: number },
  picture: { width: number; height: number },
  aspect: number,
): PictureFrame => {
  const seen = frameWindow(picture.width, picture.height, aspect, frame);
  const roomAcross = (picture.width - seen.width) / 2;
  const roomDown = (picture.height - seen.height) / 2;
  const clamp = (at: number): number => Math.min(Math.max(at, -1), 1);

  return {
    zoom: frame.zoom,
    x: roomAcross <= 0 ? 0 : clamp(frame.x - (by.x * seen.width) / roomAcross),
    y: roomDown <= 0 ? 0 : clamp(frame.y - (by.y * seen.height) / roomDown),
  };
};

export { movedFrame };
