import { frameWindow } from '@ValenceCore/pictures/frameWindow';
import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';

/**
 * The part of a picture its frame chose, in whole pixels that stay inside it, ready to be cut out.
 *
 * @param width - How wide the picture is.
 * @param height - How tall the picture is.
 * @param aspect - How wide the shape it is cut to is for its height.
 * @param frame - Where it sits in that shape, or nothing for its middle.
 * @returns The part to cut.
 */
const frameRegion = (
  width: number,
  height: number,
  aspect: number,
  frame: PhotoFrame | null,
): { left: number; top: number; width: number; height: number } => {
  const seen = frameWindow(width, height, aspect, frame);
  const across = Math.min(Math.max(1, Math.round(seen.width)), width);
  const down = Math.min(Math.max(1, Math.round(seen.height)), height);

  return {
    left: Math.min(Math.max(Math.round(seen.left), 0), width - across),
    top: Math.min(Math.max(Math.round(seen.top), 0), height - down),
    width: across,
    height: down,
  };
};

export { frameRegion };
