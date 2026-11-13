import { PhotoFrameSchema } from '@ValenceContracts/schemas/ViewerProfile';
import { CROPS } from '@ValenceServer/pictures/CROPS';
import type { PictureCrop } from '@ValenceServer/pictures/PictureCrop';
import { UPLOAD_ADDRESS } from './UPLOAD_ADDRESS';

/**
 * Reads an address an uploaded picture was chosen under: which upload it is, and the shape and part
 * of it chosen where it was framed. An address whose frame is not one a picture can have, such as
 * one drawn nearer than nothing, is not taken for an upload at all.
 *
 * @param url - The address.
 * @returns The upload and how it is cut, or nothing where the address is not a sound one.
 */
const uploadAddressOf = (url: string): { id: string; cropping: PictureCrop | null } | null => {
  const [, id, kind, zoom, x, y] = UPLOAD_ADDRESS.exec(url) ?? [];

  if (id === undefined) {
    return null;
  }

  if (kind !== 'poster' && kind !== 'backdrop') {
    return { id, cropping: null };
  }

  const frame = PhotoFrameSchema.safeParse({ zoom: Number(zoom), x: Number(x), y: Number(y) });

  return frame.success ? { id, cropping: { crop: CROPS[kind], frame: frame.data } } : null;
};

export { uploadAddressOf };
