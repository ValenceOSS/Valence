import sharp from 'sharp';
import { frameRegion } from './frameRegion';
import type { Crop } from './Crop';
import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';

/**
 * Cuts the part of an upload its frame chose, in the shape it is shown in, the right way up and no
 * larger than it is ever drawn, as WebP carrying nothing else the file did. An animated picture keeps
 * moving.
 *
 * @param body - The upload.
 * @param frame - Where it sits in its shape, or nothing for its middle.
 * @param crop - The shape, how large it may be, and how finely it is saved.
 * @returns The cut picture.
 * @throws If the upload cannot be read as a picture.
 */
const cropPicture = async (
  body: Uint8Array,
  frame: PhotoFrame | null,
  crop: Crop,
): Promise<Uint8Array> => {
  const measured = await sharp(body, { animated: true }).metadata();
  const upright = measured.autoOrient;
  const isAnimated = (measured.pages ?? 1) > 1;
  const height = isAnimated ? (measured.pageHeight ?? upright.height) : upright.height;

  return new Uint8Array(
    await sharp(body, { animated: true, autoOrient: true })
      .extract(frameRegion(upright.width, height, crop.aspect, frame))
      .resize({
        width: crop.longestEdge,
        height: crop.longestEdge,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: crop.quality })
      .toBuffer(),
  );
};

export { cropPicture };
