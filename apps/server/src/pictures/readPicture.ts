import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PICTURE_FOLDERS } from './PICTURE_FOLDERS';
import { processedNameOf } from './processedNameOf';

/**
 * Reads the cleaned copy of a kept picture, never the upload it was made from.
 *
 * @param directory - The folder the pictures are kept in.
 * @param name - What the original is called, extension and all.
 * @returns The picture and its type, or nothing where there is none to show.
 */
const readPicture = async (
  directory: string,
  name: string,
): Promise<{ body: Uint8Array; contentType: string } | null> => {
  const body = await readFile(
    join(directory, PICTURE_FOLDERS.processed, processedNameOf(name)),
  ).catch(() => null);

  return body === null ? null : { body, contentType: 'image/webp' };
};

export { readPicture };
