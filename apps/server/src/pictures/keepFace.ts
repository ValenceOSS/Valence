import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PICTURE_FOLDERS } from './PICTURE_FOLDERS';
import { cropPicture } from './cropPicture';
import { CROPS } from './CROPS';
import { framedNameOf } from './framedNameOf';
import { processFace } from './processFace';
import { processedNameOf } from './processedNameOf';
import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';
import type { PictureTone } from '@ValenceCore/pictures/PictureTone';

/**
 * Keeps an uploaded face three times: the upload exactly as it came, among the originals, and the
 * two pictures made from it that are shown, among the processed — the whole picture, and the square
 * of it its frame chose.
 *
 * @param directory - The folder faces are kept in.
 * @param name - What the original is called, extension and all.
 * @param body - The upload.
 * @param frame - Where it sits in its circle, or nothing where it fills the circle as it is.
 * @param tone - The filter the square is drawn in, or nothing to draw it as it is.
 * @returns Nothing, or that the picture could not be read to be processed.
 */
const keepFace = async (
  directory: string,
  name: string,
  body: Uint8Array,
  frame: PhotoFrame | null,
  tone: PictureTone | null = null,
): Promise<'unreadable' | null> => {
  const whole = await processFace(body).catch(() => null);
  const framed =
    whole === null ? null : await cropPicture(body, frame, CROPS.face, tone).catch(() => null);

  if (whole === null || framed === null) {
    return 'unreadable';
  }

  await mkdir(join(directory, PICTURE_FOLDERS.originals), { recursive: true });
  await mkdir(join(directory, PICTURE_FOLDERS.processed), { recursive: true });
  await writeFile(join(directory, PICTURE_FOLDERS.originals, name), body);
  await writeFile(join(directory, PICTURE_FOLDERS.processed, processedNameOf(name)), whole);
  await writeFile(join(directory, PICTURE_FOLDERS.processed, framedNameOf(name)), framed);

  return null;
};

export { keepFace };
