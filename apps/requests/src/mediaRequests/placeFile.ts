import { copyFile, link, mkdir, rename, stat, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';

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
 * Puts a downloaded file where it belongs in a library. A hard link is made where the two are on
 * the same disk, so the file takes no more room and a torrent goes on seeding it. Where they are
 * not, a torrent's file is copied, so it can still seed, and anything else is moved.
 *
 * Something already at the destination is replaced, unless it is the very same file.
 *
 * @param source - The downloaded file.
 * @param destination - Where it belongs.
 * @param isKeepingSource - Whether the download must keep its file, as a seeding torrent must.
 * @returns How it was put there.
 */
const placeFile = async (
  source: string,
  destination: string,
  isKeepingSource: boolean,
): Promise<'linked' | 'copied' | 'moved' | 'already'> => {
  await mkdir(dirname(destination), { recursive: true });

  const [from, to] = await Promise.all([stat(source), stat(destination).catch(() => null)]);

  if (to !== null) {
    if (to.ino === from.ino && to.dev === from.dev) {
      return 'already';
    }

    await unlink(destination);
  }

  try {
    await link(source, destination);

    return 'linked';
  } catch (error) {
    if (!(error instanceof Error) || !isErrorOf(error, ['EXDEV', 'EPERM', 'ENOTSUP', 'EMLINK'])) {
      throw error;
    }
  }

  if (isKeepingSource) {
    await copyFile(source, destination);

    return 'copied';
  }

  try {
    await rename(source, destination);
  } catch (error) {
    if (!(error instanceof Error) || !isErrorOf(error, ['EXDEV'])) {
      throw error;
    }

    await copyFile(source, destination);
    await unlink(source);
  }

  return 'moved';
};

export { placeFile };
