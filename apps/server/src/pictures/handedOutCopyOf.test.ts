import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { CROPS } from './CROPS';
import { handedOutCopyOf } from './handedOutCopyOf';

const aWidePicture = () =>
  sharp({ create: { width: 1600, height: 900, channels: 3, background: '#3a8ee8' } })
    .jpeg()
    .toBuffer();

describe('handedOutCopyOf', () => {
  it('keeps a picture whole where it is not shown in a shape', async () => {
    const made = await sharp(await handedOutCopyOf(await aWidePicture(), null)).metadata();

    expect([made.format, made.width, made.height]).toEqual(['webp', 1600, 900]);
  });

  it('cuts a picture to its shape where it is shown in one', async () => {
    const made = await sharp(
      await handedOutCopyOf(await aWidePicture(), { crop: CROPS.cover, frame: null }),
    ).metadata();

    expect([made.width, made.height]).toEqual([900, 900]);
  });
});
