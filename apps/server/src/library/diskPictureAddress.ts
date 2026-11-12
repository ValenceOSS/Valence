import { DISK_PICTURE } from '@ValenceServer/library/DISK_PICTURE';

/**
 * The address a picture beside a title's files on the disk is chosen and kept under, so it is drawn
 * through the same cache as the catalogue's pictures.
 *
 * @param path - The picture's file.
 * @returns The address.
 */
const diskPictureAddress = (path: string): string =>
  `${DISK_PICTURE}${Buffer.from(path, 'utf8').toString('base64url')}`;

export { diskPictureAddress };
