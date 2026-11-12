import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PICTURE_FOLDERS } from './PICTURE_FOLDERS';
import { cleanPicture } from './cleanPicture';
import { processedNameOf } from './processedNameOf';

/**
 * Keeps an uploaded picture as it came among the originals, and beside it the cleaned copy that is
 * handed out in its place.
 *
 * @param directory - The folder the pictures are kept in.
 * @param name - What the original is called, extension and all.
 * @param body - The uploaded picture.
 * @returns Why it could not be kept, or nothing once it is.
 */
const keepPicture = async (
  directory: string,
  name: string,
  body: Uint8Array,
): Promise<'unreadable' | null> => {
  const cleaned = await cleanPicture(body).catch(() => null);

  if (cleaned === null) {
    return 'unreadable';
  }

  await mkdir(join(directory, PICTURE_FOLDERS.originals), { recursive: true });
  await mkdir(join(directory, PICTURE_FOLDERS.processed), { recursive: true });
  await writeFile(join(directory, PICTURE_FOLDERS.originals, name), body);
  await writeFile(join(directory, PICTURE_FOLDERS.processed, processedNameOf(name)), cleaned);

  return null;
};

export { keepPicture };
