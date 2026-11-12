import sharp from 'sharp';
import { frameRegion } from './frameRegion';
import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';

const EDGE = 512;

const QUALITY = 82;

/**
 * Makes the picture a framed face is shown with: the square of the upload its circle shows, turned
 * the way the camera said it was held, no larger than a face is ever drawn, saved as WebP, and with
 * nothing else the file carried. An animated picture keeps moving.
 *
 * @param body - The uploaded picture.
 * @param frame - Where it sits in its circle, or nothing where it fills the circle as it is.
 * @returns The framed picture.
 * @throws If the picture cannot be read.
 */
const cropFace = async (body: Uint8Array, frame: PhotoFrame | null): Promise<Uint8Array> => {
  const measured = await sharp(body, { animated: true }).metadata();
  const upright = measured.autoOrient;
  const isAnimated = (measured.pages ?? 1) > 1;
  const height = isAnimated ? (measured.pageHeight ?? upright.height) : upright.height;

  return new Uint8Array(
    await sharp(body, { animated: true, autoOrient: true })
      .extract(frameRegion(upright.width, height, frame))
      .resize({ width: EDGE, height: EDGE, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer(),
  );
};

export { cropFace };
