import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { processFace } from './processFace';

const TWO_FRAMES =
  'R0lGODlhAQABAIAAAP8AAAAA/yH/C05FVFNDQVBFMi4wAwEAAAAh+QQACgAAACwAAAAAAQABAAACAkQBACH5BAAKAAAALAAAAAABAAEAAAICTAEAOw==';

const aPicture = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: { r: 200, g: 80, b: 40 } } });

describe('processFace', () => {
  it('shrinks a picture to a thousand and twenty-four pixels on its longest edge, as WebP', async () => {
    const made = await sharp(
      await processFace(new Uint8Array(await aPicture(1290, 2796).png().toBuffer())),
    ).metadata();

    expect(made.format).toBe('webp');
    expect(made.height).toBe(1024);
    expect(made.width).toBe(472);
  });

  it('never grows a small picture', async () => {
    const made = await sharp(
      await processFace(new Uint8Array(await aPicture(200, 100).jpeg().toBuffer())),
    ).metadata();

    expect([made.width, made.height]).toEqual([200, 100]);
  });

  it('turns a photograph the way the camera was held, and keeps nothing else it carried', async () => {
    const sideways = await aPicture(300, 200)
      .jpeg()
      .withMetadata({
        orientation: 6,
        exif: { IFD0: { Make: 'A camera', Model: 'Its model' } },
      })
      .toBuffer();
    const made = await sharp(await processFace(new Uint8Array(sideways))).metadata();

    expect([made.width, made.height]).toEqual([200, 300]);
    expect(made.exif).toBeUndefined();
    expect(made.orientation).toBeUndefined();
  });

  it('keeps an animated picture moving', async () => {
    const made = await sharp(await processFace(new Uint8Array(Buffer.from(TWO_FRAMES, 'base64'))), {
      animated: true,
    }).metadata();

    expect(made.pages).toBe(2);
  });

  it('refuses what is not a picture', async () => {
    await expect(processFace(new TextEncoder().encode('not a picture'))).rejects.toThrow();
  });
});
