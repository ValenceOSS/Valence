import type { CurlFold, CurlMatrix } from '@ValenceCore/functions/pageCurl.types';

/**
 * The flip that lays a flap over: every point mirrored across the crease, as a two-dimensional
 * affine matrix in the order CSS's `matrix()` takes it.
 *
 * @param fold - The crease.
 * @returns The matrix.
 */
const reflectAcrossFold = (fold: CurlFold): CurlMatrix => {
  const { x: nx, y: ny } = fold.normal;
  const reach = 2 * (fold.at.x * nx + fold.at.y * ny);

  return [1 - 2 * nx * nx, -2 * nx * ny, -2 * nx * ny, 1 - 2 * ny * ny, reach * nx, reach * ny];
};

export { reflectAcrossFold };
