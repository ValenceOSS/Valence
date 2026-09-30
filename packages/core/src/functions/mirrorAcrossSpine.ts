import type { CurlLeaf, CurlMatrix } from '@ValenceCore/functions/pageCurl.types';

/**
 * The mirror across a page's spine, which carries a point on the page to the same place on the
 * page facing it, as a two-dimensional affine matrix in the order CSS's `matrix()` takes it.
 *
 * @param leaf - The page, where it lies and which side it is bound on.
 * @returns The matrix.
 */
const mirrorAcrossSpine = (leaf: CurlLeaf): CurlMatrix => {
  const spineX = leaf.spine === 'left' ? leaf.x : leaf.x + leaf.width;

  return [-1, 0, 0, 1, 2 * spineX, 0];
};

export { mirrorAcrossSpine };
