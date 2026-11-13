import type { PictureFrame } from './PictureFrame';

const UNFRAMED: PictureFrame = { zoom: 1, x: 0, y: 0 };

/**
 * The part of a picture its frame shows: the largest window of the shape wanted that fits inside
 * it, drawn nearer by the frame's zoom, and slid across the room left on each side by the frame's
 * x and y, from -1 at one edge to 1 at the other. A picture left alone shows its middle.
 *
 * @param width - How wide the picture is.
 * @param height - How tall the picture is.
 * @param aspect - How wide the window is for its height.
 * @param frame - Where the picture sits, or nothing for its middle.
 * @returns The window, in the picture's own pixels.
 */
const frameWindow = (
  width: number,
  height: number,
  aspect: number,
  frame: PictureFrame | null,
): { left: number; top: number; width: number; height: number } => {
  const { zoom, x, y } = frame ?? UNFRAMED;
  const isWider = width / height > aspect;
  const across = (isWider ? height * aspect : width) / zoom;
  const down = (isWider ? height : width / aspect) / zoom;
  const roomAcross = (width - across) / 2;
  const roomDown = (height - down) / 2;

  return {
    left: roomAcross + x * roomAcross,
    top: roomDown + y * roomDown,
    width: across,
    height: down,
  };
};

export { frameWindow };
