import { copyFile, link, mkdir, rename, stat, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import { NotAllowedThere } from '@ValenceRequests/mediaRequests/NotAllowedThere';

type FileSystem = {
  copyFile: typeof copyFile;
  link: typeof link;
  mkdir: typeof mkdir;
  rename: typeof rename;
  stat: typeof stat;
  unlink: typeof unlink;
};

const THIS_DISK: FileSystem = { copyFile, link, mkdir, rename, stat, unlink };

/**
 * Whether a file system error is one of the named kinds.
 *
 * @param error - What was thrown.
 * @param codes - The kinds.
 * @returns Whether it is one of them.
 */
const isErrorOf = (error: Error, codes: readonly string[]): boolean =>
  'code' in error && typeof error.code === 'string' && codes.includes(error.code);

/**
 * Who this process is running as, in the terms PUID and PGID use.
 *
 * @returns Its user and group.
 */
const runningAs = (): string =>
  process.getuid === undefined || process.getgid === undefined
    ? 'this user'
    : `user ${process.getuid().toString()} and group ${process.getgid().toString()}`;

/**
 * Links, copies or moves a file into place, as {@link placeFile} describes.
 *
 * @param source - The downloaded file.
 * @param destination - Where it belongs.
 * @param isKeepingSource - Whether the download must keep its file.
 * @param files - The file system.
 * @returns How it was put there.
 */
const placeItThere = async (
  source: string,
  destination: string,
  isKeepingSource: boolean,
  files: FileSystem,
): Promise<'linked' | 'copied' | 'moved' | 'already'> => {
  await files.mkdir(dirname(destination), { recursive: true });

  const [from, to] = await Promise.all([
    files.stat(source),
    files.stat(destination).catch(() => null),
  ]);

  if (to !== null) {
    if (to.ino === from.ino && to.dev === from.dev) {
      return 'already';
    }

    await files.unlink(destination);
  }

  try {
    await files.link(source, destination);

    return 'linked';
  } catch (error) {
    if (!(error instanceof Error) || !isErrorOf(error, ['EXDEV', 'EPERM', 'ENOTSUP', 'EMLINK'])) {
      throw error;
    }
  }

  if (isKeepingSource) {
    await files.copyFile(source, destination);

    return 'copied';
  }

  try {
    await files.rename(source, destination);
  } catch (error) {
    if (!(error instanceof Error) || !isErrorOf(error, ['EXDEV'])) {
      throw error;
    }

    await files.copyFile(source, destination);
    await files.unlink(source);
  }

  return 'moved';
};

/**
 * Puts a downloaded file where it belongs in a library. A hard link is made where the two are on
 * the same disk, so the file takes no more room and a torrent goes on seeding it. Where they are
 * not, a torrent's file is copied, so it can still seed, and anything else is moved.
 *
 * Something already at the destination is replaced, unless it is the very same file. Where the
 * service may not write there, it says which user it is running as and how to change that.
 *
 * @param source - The downloaded file.
 * @param destination - Where it belongs.
 * @param isKeepingSource - Whether the download must keep its file, as a seeding torrent must.
 * @param files - The file system.
 * @param whoAmI - Says which user and group the service runs as.
 * @returns How it was put there.
 */
const placeFile = async (
  source: string,
  destination: string,
  isKeepingSource: boolean,
  files: FileSystem = THIS_DISK,
  whoAmI: () => string = runningAs,
): Promise<'linked' | 'copied' | 'moved' | 'already'> => {
  try {
    return await placeItThere(source, destination, isKeepingSource, files);
  } catch (error) {
    if (error instanceof Error && isErrorOf(error, ['EACCES'])) {
      throw new NotAllowedThere(dirname(destination), whoAmI());
    }

    throw error;
  }
};

export { placeFile };
