import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { FACE_FOLDERS } from './FACE_FOLDERS';
import { cropFace } from './cropFace';
import { framedNameOf } from './framedNameOf';
import { processFace } from './processFace';
import { processedNameOf } from './processedNameOf';
import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';

/**
 * Keeps an uploaded face three times: the upload exactly as it came, among the originals, and the
 * two pictures made from it that are shown, among the processed — the whole picture, and the square
 * of it its frame chose.
 *
 * @param directory - The folder faces are kept in.
 * @param name - What the original is called, extension and all.
 * @param body - The upload.
 * @param frame - Where it sits in its circle, or nothing where it fills the circle as it is.
 * @returns Nothing, or that the picture could not be read to be processed.
 */
const keepFace = async (
  directory: string,
  name: string,
  body: Uint8Array,
  frame: PhotoFrame | null,
): Promise<'unreadable' | null> => {
  const made = await Promise.all([processFace(body), cropFace(body, frame)]).catch(() => null);

  if (made === null) {
    return 'unreadable';
  }

  const [whole, framed] = made;

  await mkdir(join(directory, FACE_FOLDERS.originals), { recursive: true });
  await mkdir(join(directory, FACE_FOLDERS.processed), { recursive: true });
  await writeFile(join(directory, FACE_FOLDERS.originals, name), body);
  await writeFile(join(directory, FACE_FOLDERS.processed, processedNameOf(name)), whole);
  await writeFile(join(directory, FACE_FOLDERS.processed, framedNameOf(name)), framed);

  return null;
};

export { keepFace };
