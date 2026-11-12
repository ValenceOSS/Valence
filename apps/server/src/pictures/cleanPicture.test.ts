import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { cleanPicture } from './cleanPicture';

const TWO_FRAMES = Buffer.from(
  'R0lGODlhAgACAPAAAP8AAAAA/yH/C05FVFNDQVBFMi4wAwEAAAAh+QQAAAAAACwAAAAAAgACAAACAoRRACH5BAAAAAAALAAAAAACAAIAgAAA/wAAAAIChFEAOw==',
  'base64',
);

describe('cleanPicture', () => {
  it('keeps the picture at its own size as WebP, without what the camera wrote into it', async () => {
    const photo = await sharp({
      create: { width: 3000, height: 2000, channels: 3, background: '#3a8ee8' },
    })
      .withExif({ IFD0: { Make: 'A camera', Copyright: 'Somebody' } })
      .jpeg()
      .toBuffer();
    const measured = await sharp(await cleanPicture(photo)).metadata();

    expect(measured).toMatchObject({ format: 'webp', width: 3000, height: 2000 });
    expect(measured.exif).toBeUndefined();
    expect(measured.xmp).toBeUndefined();
    expect(measured.iptc).toBeUndefined();
  });

  it('turns a picture the way the camera said it was held', async () => {
    const sideways = await sharp({
      create: { width: 30, height: 20, channels: 3, background: '#3a8ee8' },
    })
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer();

    expect(await sharp(await cleanPicture(sideways)).metadata()).toMatchObject({
      width: 20,
      height: 30,
    });
  });

  it('keeps an animated picture moving', async () => {
    expect((await sharp(await cleanPicture(TWO_FRAMES), { animated: true }).metadata()).pages).toBe(
      2,
    );
  });

  it('says so where the upload is not a picture', async () => {
    await expect(cleanPicture(new TextEncoder().encode('not a picture'))).rejects.toThrow();
  });
});
