import { clipToFold } from '@ValenceCore/functions/clipToFold';
import { curlFoldOf } from '@ValenceCore/functions/curlFoldOf';
import { reflectAcrossFold } from '@ValenceCore/functions/reflectAcrossFold';
import type { CurlLeaf, CurlPoint, PageCurl } from '@ValenceCore/functions/pageCurl.types';

/**
 * The shape of a page with one corner carried somewhere, as a page curl draws it: the part of the
 * page still lying flat, the flap that has come up, and the flip that lays the flap's back over the
 * page along the crease. Whatever lies under the page shows where the flap was.
 *
 * @param leaf - The page, where it lies and which side it is bound on.
 * @param corner - The corner that lifted, where it started.
 * @param pointer - Where it is now, already kept within reach by `clampCurl`.
 * @returns The curl, or null while the corner has hardly moved and the page lies flat.
 */
const pageCurlOf = (leaf: CurlLeaf, corner: CurlPoint, pointer: CurlPoint): PageCurl | null => {
  const fold = curlFoldOf(corner, pointer);

  if (fold === null) {
    return null;
  }

  const page = [
    { x: leaf.x, y: leaf.y },
    { x: leaf.x + leaf.width, y: leaf.y },
    { x: leaf.x + leaf.width, y: leaf.y + leaf.height },
    { x: leaf.x, y: leaf.y + leaf.height },
  ];

  return {
    fold,
    front: clipToFold(page, fold, 'rest'),
    flap: clipToFold(page, fold, 'flap'),
    reflect: reflectAcrossFold(fold),
  };
};

export { pageCurlOf };
