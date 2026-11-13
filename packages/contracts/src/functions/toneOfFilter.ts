import { PHOTO_FILTER_LOOKS } from '@ValenceContracts/constants/PHOTO_FILTER_LOOKS';
import type { PhotoFilterLook } from '@ValenceContracts/constants/PHOTO_FILTER_LOOKS';
import type { PhotoFilter } from '@ValenceContracts/schemas/ViewerProfile';

/**
 * How a filter draws a picture, with a picture that has no filter drawn as it is.
 *
 * @param filter - The filter, or nothing.
 * @returns How the picture is drawn.
 */
const toneOfFilter = (filter: PhotoFilter | undefined): PhotoFilterLook =>
  PHOTO_FILTER_LOOKS[filter ?? 'original'];

export { toneOfFilter };
