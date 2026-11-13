import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { CROPS } from './CROPS';
import { cropPicture } from './cropPicture';

const TWO_FRAMES =
  'R0lGODlhAQABAIAAAP8AAAAA/yH/C05FVFNDQVBFMi4wAwEAAAAh+QQACgAAACwAAAAAAQABAAACAkQBACH5BAAKAAAALAAAAAABAAEAAAICTAEAOw==';

const halves = () =>
  sharp({ create: { width: 2000, height: 1000, channels: 3, background: '#ff0000' } })
    .composite([
      {
        input: { create: { width: 1000, height: 1000, channels: 3, background: '#0000ff' } },
        left: 1000,
        top: 0,
      },
    ])
    .png()
    .toBuffer();

const colourAtMiddle = async (body: Uint8Array) => {
  const { data } = await sharp(body).resize(1, 1, { fit: 'cover' }).raw().toBuffer({
    resolveWithObject: true,
  });

  return [data[0], data[2]];
};

describe('cropPicture', () => {
  it('makes a square no larger than a face is drawn, as WebP', async () => {
    const made = await sharp(
      await cropPicture(new Uint8Array(await halves()), null, CROPS.face),
    ).metadata();

    expect([made.format, made.width, made.height]).toEqual(['webp', 512, 512]);
  });

  it('keeps the part of the picture its frame chose', async () => {
    const left = await cropPicture(
      new Uint8Array(await halves()),
      { zoom: 2, x: -1, y: 0 },
      CROPS.face,
    );
    const right = await cropPicture(
      new Uint8Array(await halves()),
      { zoom: 2, x: 1, y: 0 },
      CROPS.face,
    );

    expect((await colourAtMiddle(left))[0]).toBeGreaterThan(200);
    expect((await colourAtMiddle(right))[1]).toBeGreaterThan(200);
  });

  it('cuts the shape asked for, as large as it is ever drawn', async () => {
    const made = await sharp(
      await cropPicture(new Uint8Array(await halves()), null, CROPS.poster),
    ).metadata();

    expect([made.width, made.height]).toEqual([667, 1000]);
  });

  it('draws the square in the filter chosen for it', async () => {
    const made = await cropPicture(new Uint8Array(await halves()), null, CROPS.face, {
      saturate: 0,
      hueRotate: 0,
      contrast: 1,
      brightness: 1,
      layer: null,
    });
    const [red, blue] = await colourAtMiddle(made);

    expect(Math.abs((red ?? 0) - (blue ?? 0))).toBeLessThan(4);
  });

  it('frames a photograph the right way up, as the camera held it', async () => {
    const sideways = await sharp({
      create: { width: 300, height: 200, channels: 3, background: '#00ff00' },
    })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();
    const made = await sharp(
      await cropPicture(new Uint8Array(sideways), null, CROPS.face),
    ).metadata();

    expect([made.width, made.height]).toEqual([200, 200]);
    expect(made.exif).toBeUndefined();
  });

  it('keeps an animated picture moving', async () => {
    const big = await sharp(Buffer.from(TWO_FRAMES, 'base64'), { animated: true })
      .resize(100, 100, { kernel: 'nearest' })
      .gif()
      .toBuffer();
    const made = await sharp(
      await cropPicture(new Uint8Array(big), { zoom: 2, x: 0, y: 0 }, CROPS.face),
      {
        animated: true,
      },
    ).metadata();

    expect(made.pages).toBe(2);
    expect([made.width, made.pageHeight]).toEqual([50, 50]);
  });

  it('refuses what is not a picture', async () => {
    await expect(cropPicture(new TextEncoder().encode('no'), null, CROPS.face)).rejects.toThrow();
  });
});
