import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { narrowAsAsked } from './narrowAsAsked';

/**
 * A plain picture so many pixels wide.
 *
 * @param width - How wide.
 * @returns The picture, as PNG.
 */
const aPicture = (width: number) =>
  sharp({ create: { width, height: width, channels: 3, background: '#336699' } })
    .png()
    .toBuffer();

describe('narrowAsAsked', () => {
  it('narrows a picture to the width asked for, as WebP', async () => {
    const narrowed = await narrowAsAsked(new Uint8Array(await aPicture(1000)), 'small');
    const read = await sharp(Buffer.from(narrowed ?? new Uint8Array())).metadata();

    expect(read.width).toBe(342);
    expect(read.format).toBe('webp');
  });

  it('leaves the picture whole where no width was asked for', async () => {
    expect(await narrowAsAsked(new Uint8Array(await aPicture(100)), undefined)).toBeNull();
  });

  it('gives nothing where the picture cannot be read', async () => {
    expect(await narrowAsAsked(new Uint8Array([1, 2, 3]), 'small')).toBeNull();
  });
});
