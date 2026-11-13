import { UPLOAD_PICTURE } from './UPLOAD_PICTURE';
import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';

/**
 * The address a picture an administrator uploaded is chosen and kept under, carrying the shape it is
 * cut to and where it sits in it, where it was framed.
 *
 * @param id - The upload.
 * @param cropping - The shape it is shown in and where it sits, or nothing to show it whole.
 * @returns The address.
 */
const uploadPictureAddress = (
  id: string,
  cropping: { kind: 'poster' | 'backdrop'; frame: PhotoFrame } | null = null,
): string =>
  cropping === null
    ? `${UPLOAD_PICTURE}${id}`
    : `${UPLOAD_PICTURE}${id}#${cropping.kind}:${cropping.frame.zoom.toFixed(4)}:${cropping.frame.x.toFixed(4)}:${cropping.frame.y.toFixed(4)}`;

export { uploadPictureAddress };
