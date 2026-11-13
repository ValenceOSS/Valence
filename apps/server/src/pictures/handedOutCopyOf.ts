import { cleanPicture } from './cleanPicture';
import { cropPicture } from './cropPicture';
import type { PictureCrop } from './PictureCrop';

/**
 * The copy of an upload that is handed out in its place: cut to its shape where it is shown in one,
 * or else the whole picture, cleaned.
 *
 * @param body - The upload.
 * @param cropping - The shape it is cut to and where it sits in it, or nothing to keep it whole.
 * @returns The copy.
 * @throws If the upload cannot be read as a picture.
 */
const handedOutCopyOf = (body: Uint8Array, cropping: PictureCrop | null): Promise<Uint8Array> =>
  cropping === null ? cleanPicture(body) : cropPicture(body, cropping.frame, cropping.crop);

export { handedOutCopyOf };
