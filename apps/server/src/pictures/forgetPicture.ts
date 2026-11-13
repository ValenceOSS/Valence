import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { PICTURE_FOLDERS } from './PICTURE_FOLDERS';
import { processedNameOf } from './processedNameOf';

/**
 * Removes a kept picture: the original, the cleaned copy, and an upload still loose from before
 * pictures were cleaned.
 *
 * @param directory - The folder the pictures are kept in.
 * @param name - What the original is called, extension and all.
 */
const forgetPicture = async (directory: string, name: string): Promise<void> => {
  await Promise.all([
    rm(join(directory, name), { force: true }),
    rm(join(directory, PICTURE_FOLDERS.originals, name), { force: true }),
    rm(join(directory, PICTURE_FOLDERS.processed, processedNameOf(name)), { force: true }),
  ]);
};

export { forgetPicture };
