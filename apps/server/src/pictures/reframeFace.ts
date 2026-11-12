import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { FACE_FOLDERS } from './FACE_FOLDERS';
import { MOVING_FACE_TYPES } from './MOVING_FACE_TYPES';
import { cropFace } from './cropFace';
import { framedNameOf } from './framedNameOf';
import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';

/**
 * Makes a face's framed picture again from its original, for a frame chosen after it was uploaded,
 * so that nobody has to upload it again to move it in its circle.
 *
 * @param directory - The folder faces are kept in.
 * @param name - What the original is called, extension and all.
 * @param frame - Where it sits in its circle now, or nothing where it fills the circle as it is.
 * @returns Whether it was made, which it is not for a moving face or one whose original is gone.
 */
const reframeFace = async (
  directory: string,
  name: string,
  frame: PhotoFrame | null,
): Promise<boolean> => {
  if (MOVING_FACE_TYPES[extname(name)] !== undefined) {
    return false;
  }

  const original = await readFile(join(directory, FACE_FOLDERS.originals, name)).catch(() => null);
  const framed =
    original === null ? null : await cropFace(new Uint8Array(original), frame).catch(() => null);

  if (framed === null) {
    return false;
  }

  await mkdir(join(directory, FACE_FOLDERS.processed), { recursive: true });
  await writeFile(join(directory, FACE_FOLDERS.processed, framedNameOf(name)), framed);

  return true;
};

export { reframeFace };
