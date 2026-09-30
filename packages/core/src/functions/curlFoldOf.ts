import type { CurlFold, CurlPoint } from '@ValenceCore/functions/pageCurl.types';

/**
 * Where paper folds when one corner is carried to a point: along the line halfway between them and
 * square to the way it was carried, which is the only crease that lays that corner exactly there.
 *
 * @param corner - The corner that lifted, where it started.
 * @param pointer - Where it is now.
 * @returns A point on the crease and the crease's normal, pointing from the corner towards where it
 *   was carried, or null while the corner has hardly moved and there is no crease yet.
 */
const curlFoldOf = (corner: CurlPoint, pointer: CurlPoint): CurlFold | null => {
  const dx = pointer.x - corner.x;
  const dy = pointer.y - corner.y;
  const length = Math.hypot(dx, dy);

  if (length < 0.5) {
    return null;
  }

  return {
    at: { x: (corner.x + pointer.x) / 2, y: (corner.y + pointer.y) / 2 },
    normal: { x: dx / length, y: dy / length },
  };
};

export { curlFoldOf };
