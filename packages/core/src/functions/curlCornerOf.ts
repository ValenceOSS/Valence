import type { CurlLeaf, CurlPoint } from '@ValenceCore/functions/pageCurl.types';

/**
 * Which corner of a page lifts when it is taken hold of: the one on its free edge, away from the
 * spine, nearer to where it was taken hold of — the top corner for a hold in the upper half, the
 * bottom one for the lower.
 *
 * @param leaf - The page, where it lies and which side it is bound on.
 * @param heldAt - How far down it was taken hold of, in the same space as the page.
 * @returns The corner that lifts.
 */
const curlCornerOf = (leaf: CurlLeaf, heldAt: number): CurlPoint => ({
  x: leaf.spine === 'left' ? leaf.x + leaf.width : leaf.x,
  y: heldAt < leaf.y + leaf.height / 2 ? leaf.y : leaf.y + leaf.height,
});

export { curlCornerOf };
