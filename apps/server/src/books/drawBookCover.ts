import sharp from 'sharp';
import type { BookPageBytes } from './BookFile';

const WEBP_QUALITY = 82;

/**
 * Draws a book's own cover at the width a shelf shows it, rather than as the megabytes a publisher
 * shipped. A picture that will not draw is not handed back, since bytes that are no picture must never
 * be served as one.
 *
 * @param cover - The cover, as the book holds it.
 * @param width - How wide to draw it.
 * @returns The cover, drawn, or nothing where the bytes are not a picture.
 */
const drawBookCover = async (
  cover: BookPageBytes,
  width: number,
): Promise<BookPageBytes | null> => {
  const drawn = await sharp(cover.bytes)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer()
    .catch(() => null);

  return drawn === null ? null : { bytes: new Uint8Array(drawn), contentType: 'image/webp' };
};

export { drawBookCover };
