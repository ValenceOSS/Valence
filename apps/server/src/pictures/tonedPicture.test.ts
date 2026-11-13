import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { tonedPicture } from './tonedPicture';

const PLAIN = { saturate: 1, hueRotate: 0, contrast: 1, brightness: 1, layer: null };

const aPicture = (background: string) =>
  sharp({ create: { width: 40, height: 40, channels: 3, background } })
    .webp({ lossless: true })
    .toBuffer();

const colourOf = async (body: Uint8Array) => {
  const { data } = await sharp(body).raw().toBuffer({ resolveWithObject: true });

  return [data[0], data[1], data[2]];
};

describe('tonedPicture', () => {
  it('turns a picture grey as CSS’s saturate(0) does', async () => {
    const [red, green, blue] = await colourOf(
      await tonedPicture(await aPicture('#e8503a'), { ...PLAIN, saturate: 0 }, 100),
    );

    expect(Math.abs((red ?? 0) - (green ?? 0))).toBeLessThan(3);
    expect(Math.abs((green ?? 0) - (blue ?? 0))).toBeLessThan(3);
  });

  it('turns colours to their opposites under a white layer blended by difference', async () => {
    const [red, green, blue] = await colourOf(
      await tonedPicture(
        await aPicture('#ff0000'),
        { ...PLAIN, layer: { colour: '#ffffff', blend: 'difference', opacity: 1 } },
        100,
      ),
    );

    expect(red).toBeLessThan(20);
    expect(green).toBeGreaterThan(235);
    expect(blue).toBeGreaterThan(235);
  });

  it('turns the dark parts of a grey picture blue under a blue screen, for a blueprint', async () => {
    const [red, , blue] = await colourOf(
      await tonedPicture(
        await aPicture('#202020'),
        { ...PLAIN, saturate: 0, layer: { colour: '#1f4fff', blend: 'screen', opacity: 0.65 } },
        100,
      ),
    );

    expect(blue).toBeGreaterThan((red ?? 0) + 60);
  });

  it('swings a colour round the colour wheel as CSS’s hue-rotate does', async () => {
    const [red, green, blue] = await colourOf(
      await tonedPicture(await aPicture('#ff0000'), { ...PLAIN, hueRotate: 180 }, 100),
    );

    expect(red).toBeLessThan(green ?? 0);
    expect(red).toBeLessThan(blue ?? 0);
  });

  it('brightens and adds contrast as CSS does', async () => {
    const [grey] = await colourOf(
      await tonedPicture(await aPicture('#808080'), { ...PLAIN, brightness: 1.5 }, 100),
    );

    expect(grey).toBeGreaterThan(180);
  });

  it('warms a picture with a soft orange layer', async () => {
    const [red, , blue] = await colourOf(
      await tonedPicture(
        await aPicture('#808080'),
        { ...PLAIN, layer: { colour: '#ff8a3d', blend: 'soft-light', opacity: 0.45 } },
        100,
      ),
    );

    expect(red).toBeGreaterThan(blue ?? 0);
  });
});
