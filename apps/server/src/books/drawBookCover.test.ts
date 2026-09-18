import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { drawBookCover } from './drawBookCover';

/**
 * Draws a plain picture of the given size, as a PNG.
 */
const aPicture = async (width: number, height: number): Promise<Uint8Array> =>
  new Uint8Array(
    await sharp({ create: { width, height, channels: 3, background: '#335577' } })
      .png()
      .toBuffer(),
  );

describe('drawBookCover', () => {
  it('draws a large cover at the width a shelf shows it', async () => {
    const drawn = await drawBookCover(
      { bytes: await aPicture(1600, 2400), contentType: 'image/png' },
      640,
    );

    expect(drawn.contentType).toBe('image/webp');
    expect((await sharp(drawn.bytes).metadata()).width).toBe(640);
  });

  it('never draws a small cover larger than it is', async () => {
    const drawn = await drawBookCover(
      { bytes: await aPicture(300, 450), contentType: 'image/png' },
      640,
    );

    expect((await sharp(drawn.bytes).metadata()).width).toBe(300);
  });

  it('hands back a picture it cannot draw as it was', async () => {
    const broken = { bytes: new Uint8Array([1, 2, 3]), contentType: 'image/jpeg' };

    expect(await drawBookCover(broken, 640)).toBe(broken);
  });
});
