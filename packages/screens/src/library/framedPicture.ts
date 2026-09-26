import type { CSSProperties } from 'react';
import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';

/**
 * How a framed photograph sits in its circle: grown by its zoom and slid by its position, where a
 * position of one moves it as far as the zoom leaves room to, and never far enough to show an edge.
 *
 * @param frame - The zoom and position chosen for it, or nothing where it fills the circle as it is.
 * @returns The style to draw it with.
 */
const framedPicture = (frame: PhotoFrame | null): CSSProperties => {
  if (frame === null) {
    return {};
  }

  const room = ((frame.zoom - 1) / (2 * frame.zoom)) * 100;

  return {
    transform: `scale(${frame.zoom.toString()}) translate(${(-frame.x * room).toFixed(3)}%, ${(-frame.y * room).toFixed(3)}%)`,
  };
};

export { framedPicture };
