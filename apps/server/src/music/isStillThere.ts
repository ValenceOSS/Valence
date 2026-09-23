import { access } from 'node:fs/promises';

/**
 * Whether a file is still where it was left. Only a file that is plainly not there counts as gone:
 * one that cannot be looked at — a folder whose permissions changed, a disk slow to answer — is
 * taken to still be there, so a picture that exists is never forgotten for being unreadable.
 *
 * @param path - The file.
 * @returns Whether it is there, or might be.
 */
const isStillThere = async (path: string): Promise<boolean> =>
  access(path).then(
    () => true,
    (error: NodeJS.ErrnoException) => error.code !== 'ENOENT' && error.code !== 'ENOTDIR',
  );

export { isStillThere };
