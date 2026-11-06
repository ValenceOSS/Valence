import { copyFile, mkdir, rename, rm } from 'node:fs/promises';
import { dirname } from 'node:path';

/**
 * Moves one file, renaming it where both places are on one disk and copying it across then
 * removing the original where they are not, since a rename cannot cross from one disk to another.
 *
 * @param from - Where it is.
 * @param to - Where it goes.
 */
const moveFile = async (from: string, to: string): Promise<void> => {
  await mkdir(dirname(to), { recursive: true });

  try {
    await rename(from, to);
  } catch (error) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'EXDEV') {
      throw error;
    }

    await copyFile(from, to);
    await rm(from);
  }
};

export { moveFile };
