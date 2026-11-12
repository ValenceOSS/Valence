import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { FACE_FOLDERS } from './FACE_FOLDERS';
import { MOVING_FACE_TYPES } from './MOVING_FACE_TYPES';
import { framedNameOf } from './framedNameOf';
import { processedNameOf } from './processedNameOf';

/**
 * Reads a picture a face is shown with, never the upload it was made from: the square its frame
 * chose, for an app that asks for it, or the whole picture, for one that frames it itself. A moving
 * face, which nothing processes, is shown as it came.
 *
 * @param directory - The folder faces are kept in.
 * @param name - What the original is called, extension and all.
 * @param isFramed - Whether the framed square is wanted rather than the whole picture.
 * @returns The picture and its type, or nothing where there is none to show.
 */
const readFace = async (
  directory: string,
  name: string,
  isFramed: boolean,
): Promise<{ body: Uint8Array; contentType: string } | null> => {
  const moving = MOVING_FACE_TYPES[extname(name)];

  if (moving !== undefined) {
    const body = await readFile(join(directory, FACE_FOLDERS.originals, name)).catch(() => null);

    return body === null ? null : { body, contentType: moving };
  }

  const body = await readFile(
    join(directory, FACE_FOLDERS.processed, isFramed ? framedNameOf(name) : processedNameOf(name)),
  ).catch(() => null);

  return body === null ? null : { body, contentType: 'image/webp' };
};

export { readFace };
