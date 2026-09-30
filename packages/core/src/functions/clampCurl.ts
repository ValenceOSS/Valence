import type { CurlLeaf, CurlPoint } from '@ValenceCore/functions/pageCurl.types';

/**
 * Pulls a point back to the nearest point no further than a distance from a centre.
 *
 * @param point - The point.
 * @param centre - The centre.
 * @param radius - The furthest it may be.
 * @returns The point, or the nearest one within reach.
 */
const within = (point: CurlPoint, centre: CurlPoint, radius: number): CurlPoint => {
  const dx = point.x - centre.x;
  const dy = point.y - centre.y;
  const distance = Math.hypot(dx, dy);

  return distance <= radius || distance === 0
    ? point
    : { x: centre.x + (dx / distance) * radius, y: centre.y + (dy / distance) * radius };
};

/**
 * Keeps a lifted corner somewhere paper could put it without tearing along the spine: no further
 * from the spine's end on its own side than the page is wide, and no further from the spine's other
 * end than the page's diagonal.
 *
 * @param leaf - The page, where it lies and which side it is bound on.
 * @param corner - The corner that lifted.
 * @param pointer - Where the corner is being pulled to.
 * @returns Where the corner can actually go.
 */
const clampCurl = (leaf: CurlLeaf, corner: CurlPoint, pointer: CurlPoint): CurlPoint => {
  const spineX = leaf.spine === 'left' ? leaf.x : leaf.x + leaf.width;
  const otherY = corner.y === leaf.y ? leaf.y + leaf.height : leaf.y;
  const hinged = within(pointer, { x: spineX, y: corner.y }, leaf.width);

  return within(hinged, { x: spineX, y: otherY }, Math.hypot(leaf.width, leaf.height));
};

export { clampCurl };
