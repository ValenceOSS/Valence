import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { narrowPicture } from './narrowPicture';

/**
 * A plain picture of a given width, as PNG.
 *
 * @param width - How many pixels across.
 * @returns The picture.
 */
const aPicture = (width: number): Promise<Buffer> =>
  sharp({ create: { width, height: 10, channels: 3, background: '#336699' } })
    .png()
    .toBuffer();

describe('narrowPicture', () => {
  it('narrows a wide picture to WebP at the width asked for', async () => {
    const narrowed = await narrowPicture(await aPicture(1200), 342);
    const read = await sharp(narrowed ?? Buffer.alloc(0)).metadata();

    expect(read).toMatchObject({ width: 342, format: 'webp' });
  });

  it('never enlarges a picture already narrower', async () => {
    const narrowed = await narrowPicture(await aPicture(100), 342);

    expect((await sharp(narrowed ?? Buffer.alloc(0)).metadata()).width).toBe(100);
  });

  it('refuses to decode a picture of more than forty million pixels', async () => {
    const huge = await sharp({
      create: { width: 8000, height: 6000, channels: 3, background: '#000000' },
    })
      .png({ compressionLevel: 9 })
      .toBuffer();

    expect(await narrowPicture(huge, 342)).toBeNull();
  }, 30_000);

  it('says so when the bytes are not a picture', async () => {
    expect(await narrowPicture(Buffer.from('not a picture'), 342)).toBeNull();
  });
});
