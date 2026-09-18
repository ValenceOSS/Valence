import sharp from 'sharp';
import type { BookPageBytes } from './BookFile';

const WEBP_QUALITY = 82;

/**
 * Draws a book's own cover at the width a shelf shows it, rather than as the megabytes a publisher
 * shipped. A picture that will not draw is handed back as it was, since a cover the browser may yet
 * manage is better than none.
 *
 * @param cover - The cover, as the book holds it.
 * @param width - How wide to draw it.
 * @returns The cover, drawn.
 */
const drawBookCover = async (cover: BookPageBytes, width: number): Promise<BookPageBytes> => {
  const drawn = await sharp(cover.bytes)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer()
    .catch(() => null);

  return drawn === null ? cover : { bytes: new Uint8Array(drawn), contentType: 'image/webp' };
};

export { drawBookCover };
