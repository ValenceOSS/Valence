import sharp from 'sharp';

const NARROWED_QUALITY = 80;

const MOST_PIXELS = 40_000_000;

/**
 * Makes a narrower copy of a picture, as WebP, for somewhere that draws it a few hundred pixels
 * wide. A picture already narrower is re-encoded at its own width rather than enlarged, and one of
 * more than forty million pixels is refused rather than decoded.
 *
 * @param picture - The whole picture.
 * @param width - The most pixels across the copy may have.
 * @returns The copy, or null where the picture could not be read.
 */
const narrowPicture = (picture: Buffer, width: number): Promise<Buffer<ArrayBuffer> | null> =>
  sharp(picture, { limitInputPixels: MOST_PIXELS })
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: NARROWED_QUALITY })
    .toBuffer()
    .catch(() => null);

export { narrowPicture };
