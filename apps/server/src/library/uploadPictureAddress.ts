import { UPLOAD_PICTURE } from './UPLOAD_PICTURE';

/**
 * The address a picture an administrator uploaded is chosen and kept under.
 *
 * @param id - The upload.
 * @returns The address.
 */
const uploadPictureAddress = (id: string): string => `${UPLOAD_PICTURE}${id}`;

export { uploadPictureAddress };
