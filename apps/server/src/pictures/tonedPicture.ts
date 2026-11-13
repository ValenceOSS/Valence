import sharp from 'sharp';
import { toneMatrix } from '@ValenceCore/pictures/toneMatrix';
import type { PictureTone } from '@ValenceCore/pictures/PictureTone';

/**
 * How colourful a tone makes a picture and how far round the colour wheel it swings it, as the three
 * rows sharp recombines red, green and blue by, read from the matrix every client draws the tone with.
 *
 * @param tone - The tone.
 * @returns The rows for red, green and blue.
 */
const colouring = (
  tone: PictureTone,
): [[number, number, number], [number, number, number], [number, number, number]] => {
  const matrix = toneMatrix({ ...tone, contrast: 1, brightness: 1, layer: null });
  const row = (at: number): [number, number, number] => [
    matrix[at] ?? 0,
    matrix[at + 1] ?? 0,
    matrix[at + 2] ?? 0,
  ];

  return [row(0), row(5), row(10)];
};

/**
 * Draws a picture in a tone as a browser previews it: made more or less colourful and swung round
 * the colour wheel, then more or less contrasting, then brighter or darker, each as CSS draws it, and
 * then a colour laid over it and blended — softly, as an overlay, as a screen, or by difference. An
 * animated picture is toned on every frame.
 *
 * @param body - The picture, saved without loss.
 * @param tone - The tone.
 * @param quality - How finely the toned picture is saved.
 * @returns The toned picture, as WebP.
 * @throws If the picture cannot be read.
 */
const tonedPicture = async (
  body: Uint8Array,
  tone: PictureTone,
  quality: number,
): Promise<Uint8Array> => {
  const read = { animated: true } as const;
  const coloured =
    tone.saturate === 1 && tone.hueRotate === 0
      ? body
      : await sharp(body, read).recomb(colouring(tone)).webp({ lossless: true }).toBuffer();
  const lit =
    tone.contrast === 1 && tone.brightness === 1
      ? coloured
      : await sharp(coloured, read)
          .linear(tone.contrast * tone.brightness, 127.5 * (1 - tone.contrast) * tone.brightness)
          .webp({ lossless: true })
          .toBuffer();

  if (tone.layer === null) {
    return new Uint8Array(await sharp(lit, read).webp({ quality }).toBuffer());
  }

  const measured = await sharp(lit, read).metadata();
  const height = measured.pageHeight ?? measured.height;
  const [red = 0, green = 0, blue = 0] = (tone.layer.colour.match(/[0-9a-f]{2}/giu) ?? []).map(
    (pair: string) => Number.parseInt(pair, 16),
  );
  const overlay = await sharp({
    create: {
      width: measured.width,
      height,
      channels: 4,
      background: { r: red, g: green, b: blue, alpha: tone.layer.opacity },
    },
  })
    .png()
    .toBuffer();

  return new Uint8Array(
    await sharp(lit, read)
      .composite([{ input: overlay, blend: tone.layer.blend, tile: true }])
      .webp({ quality })
      .toBuffer(),
  );
};

export { tonedPicture };
