import type { CurlLeaf, CurlPoint } from '@ValenceCore/functions/pageCurl.types';

/**
 * Where a lifted corner comes to rest once its page has turned all the way over: its reflection
 * across the spine.
 *
 * @param leaf - The page, where it lies and which side it is bound on.
 * @param corner - The corner that lifted.
 * @returns Where that corner lies once the page is over.
 */
const curlAwayOf = (leaf: CurlLeaf, corner: CurlPoint): CurlPoint => {
  const spineX = leaf.spine === 'left' ? leaf.x : leaf.x + leaf.width;

  return { x: 2 * spineX - corner.x, y: corner.y };
};

export { curlAwayOf };
