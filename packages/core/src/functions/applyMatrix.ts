import type { CurlMatrix, CurlPoint } from '@ValenceCore/functions/pageCurl.types';

/**
 * Where an affine matrix carries a point.
 *
 * @param matrix - The matrix, in the order CSS's `matrix()` takes it.
 * @param point - The point.
 * @returns Where it lands.
 */
const applyMatrix = (matrix: CurlMatrix, point: CurlPoint): CurlPoint => {
  const [a, b, c, d, e, f] = matrix;

  return { x: a * point.x + c * point.y + e, y: b * point.x + d * point.y + f };
};

export { applyMatrix };
