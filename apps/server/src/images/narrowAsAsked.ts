import { ARTWORK_WIDTHS } from '@ValenceContracts/constants/ARTWORK_WIDTHS';
import { narrowPicture } from '@ValenceServer/images/narrowPicture';

/**
 * Narrows a picture to one of the widths a client may ask for, where it asked for one.
 *
 * @param picture - The whole picture.
 * @param size - The narrowed copy asked for, or nothing for the whole picture.
 * @returns The narrowed copy, as WebP, or nothing where none was asked for or it could not be made.
 */
const narrowAsAsked = async (
  picture: Uint8Array,
  size: keyof typeof ARTWORK_WIDTHS | undefined,
): Promise<Uint8Array | null> =>
  size === undefined ? null : narrowPicture(Buffer.from(picture), ARTWORK_WIDTHS[size]);

export { narrowAsAsked };
