import sharp from 'sharp';

const LONGEST_EDGE = 1024;

const QUALITY = 82;

/**
 * Makes the picture a face is shown with from what was uploaded: turned the way the camera said it
 * was held, no larger than a face is ever drawn on the largest screen, saved as WebP, and with
 * everything else the file carried — the camera, the time, where it was taken — left behind. An
 * animated picture keeps moving.
 *
 * @param body - The uploaded picture.
 * @returns The processed picture.
 * @throws If the picture cannot be read.
 */
const processFace = async (body: Uint8Array): Promise<Uint8Array> =>
  new Uint8Array(
    await sharp(body, { animated: true })
      .rotate()
      .resize({
        width: LONGEST_EDGE,
        height: LONGEST_EDGE,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: QUALITY })
      .toBuffer(),
  );

export { processFace };
