import { frameWindow } from './frameWindow';
import type { PictureFrame } from './PictureFrame';

/**
 * Where a picture sits once it is drawn nearer or further, keeping the same point in the middle of
 * the window wherever its edges allow.
 *
 * @param frame - Where it sits now.
 * @param zoom - How near it is wanted, kept between 1 and the most allowed.
 * @param picture - How wide and tall the picture is.
 * @param aspect - How wide the window is for its height.
 * @param mostZoom - The nearest a picture may be drawn.
 * @returns Where it sits now.
 */
const zoomedFrame = (
  frame: PictureFrame,
  zoom: number,
  picture: { width: number; height: number },
  aspect: number,
  mostZoom: number,
): PictureFrame => {
  const nearer = Math.min(Math.max(zoom, 1), mostZoom);
  const was = frameWindow(picture.width, picture.height, aspect, frame);
  const now = frameWindow(picture.width, picture.height, aspect, { zoom: nearer, x: 0, y: 0 });
  const middleAcross = was.left + was.width / 2;
  const middleDown = was.top + was.height / 2;
  const roomAcross = (picture.width - now.width) / 2;
  const roomDown = (picture.height - now.height) / 2;
  const along = (middle: number, size: number, room: number) =>
    room <= 0 ? 0 : Math.min(Math.max((middle - size / 2) / room, -1), 1);

  return {
    zoom: nearer,
    x: along(middleAcross, picture.width, roomAcross),
    y: along(middleDown, picture.height, roomDown),
  };
};

export { zoomedFrame };
