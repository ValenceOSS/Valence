import sharp from 'sharp';

const QUALITY = 90;

/**
 * Makes the copy of an uploaded picture that is handed out: turned the way the camera said it was
 * held, saved as WebP at its own size, and with everything else the file carried — the camera, the
 * time, where it was taken — left behind. An animated picture keeps moving.
 *
 * @param body - The uploaded picture.
 * @returns The cleaned picture.
 * @throws If the picture cannot be read.
 */
const cleanPicture = async (body: Uint8Array): Promise<Uint8Array> =>
  new Uint8Array(
    await sharp(body, { animated: true }).rotate().webp({ quality: QUALITY }).toBuffer(),
  );

export { cleanPicture };
