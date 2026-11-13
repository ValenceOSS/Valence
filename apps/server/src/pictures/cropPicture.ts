import sharp from 'sharp';
import { frameRegion } from './frameRegion';
import { tonedPicture } from './tonedPicture';
import type { PictureTone } from '@ValenceCore/pictures/PictureTone';
import type { Crop } from './Crop';
import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';

/**
 * Cuts the part of an upload its frame chose, in the shape it is shown in, the right way up and no
 * larger than it is ever drawn, in the filter chosen for it, as WebP carrying nothing else the file
 * did. An animated picture keeps moving.
 *
 * @param body - The upload.
 * @param frame - Where it sits in its shape, or nothing for its middle.
 * @param crop - The shape, how large it may be, and how finely it is saved.
 * @param tone - The filter it is drawn in, or nothing to draw it as it is.
 * @returns The cut picture.
 * @throws If the upload cannot be read as a picture.
 */
const cropPicture = async (
  body: Uint8Array,
  frame: PhotoFrame | null,
  crop: Crop,
  tone: PictureTone | null = null,
): Promise<Uint8Array> => {
  const measured = await sharp(body, { animated: true }).metadata();
  const upright = measured.autoOrient;
  const isAnimated = (measured.pages ?? 1) > 1;
  const height = isAnimated ? (measured.pageHeight ?? upright.height) : upright.height;

  const isToned =
    tone !== null &&
    (tone.saturate !== 1 ||
      tone.hueRotate !== 0 ||
      tone.contrast !== 1 ||
      tone.brightness !== 1 ||
      tone.layer !== null);
  const cut = await sharp(body, { animated: true, autoOrient: true })
    .extract(frameRegion(upright.width, height, crop.aspect, frame))
    .resize({
      width: crop.longestEdge,
      height: crop.longestEdge,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp(isToned ? { lossless: true } : { quality: crop.quality })
    .toBuffer();

  return tone === null || !isToned
    ? new Uint8Array(cut)
    : tonedPicture(new Uint8Array(cut), tone, crop.quality);
};

export { cropPicture };
