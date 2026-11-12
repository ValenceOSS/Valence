import { copyFile, rename, unlink } from 'node:fs/promises';

/**
 * Moves a file, copying it across where it would have to cross from one disk to another.
 *
 * @param from - Where it is.
 * @param to - Where it goes.
 */
const moveFile = async (from: string, to: string): Promise<void> => {
  await rename(from, to).catch(async (error: NodeJS.ErrnoException) => {
    if (error.code !== 'EXDEV') {
      throw error;
    }

    await copyFile(from, to);
    await unlink(from);
  });
};

export { moveFile };
