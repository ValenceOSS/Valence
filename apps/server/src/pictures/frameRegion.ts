import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';

/**
 * The square of a picture its circle shows, as the apps have always drawn a framed face: the
 * largest square in the middle, drawn nearer by the zoom and slid by the position, where a position
 * of one moves it as far as the zoom leaves room to and never far enough to show an edge.
 *
 * @param width - The picture's width, the right way up.
 * @param height - The picture's height, the right way up.
 * @param frame - The zoom and position chosen for it, or nothing where it fills the circle as it is.
 * @returns The square, in whole pixels, inside the picture.
 */
const frameRegion = (
  width: number,
  height: number,
  frame: PhotoFrame | null,
): { left: number; top: number; width: number; height: number } => {
  const { zoom, x, y } = frame ?? { zoom: 1, x: 0, y: 0 };
  const shorter = Math.min(width, height);
  const side = Math.max(1, Math.round(shorter / zoom));
  const slide = ((zoom - 1) / (2 * zoom)) * shorter;
  const clamp = (at: number, room: number) => Math.min(Math.max(Math.round(at), 0), room);

  return {
    left: clamp(width / 2 + x * slide - side / 2, width - side),
    top: clamp(height / 2 + y * slide - side / 2, height - side),
    width: side,
    height: side,
  };
};

export { frameRegion };
