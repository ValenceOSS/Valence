import { rm } from 'node:fs/promises';

/**
 * Takes away the folders a download's zips were unpacked into, once their books are filed.
 *
 * @param folders - The folders.
 */
const forgetUnpacked = async (folders: readonly string[]): Promise<void> => {
  await Promise.all(
    folders.map((folder) => rm(folder, { recursive: true, force: true }).catch(() => undefined)),
  );
};

export { forgetUnpacked };
