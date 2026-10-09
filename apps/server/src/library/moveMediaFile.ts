import { copyFile, mkdir, readdir, rename, rm, stat } from 'node:fs/promises';
import { basename, dirname, extname, join, relative } from 'node:path';
import { diskRefusalOf } from '@ValenceServer/files/diskRefusalOf';
import { isSidecarOf } from '@ValenceServer/library/isSidecarOf';
import { isUnderAny } from '@ValenceServer/library/isUnderAny';
import { removeEmptyFoldersUpTo } from '@ValenceServer/library/removeEmptyFoldersUpTo';

type MediaFileMove =
  | { kind: 'moved'; to: string }
  | { kind: 'outside' }
  | { kind: 'taken' }
  | { kind: 'missing' }
  | { kind: 'readOnly' }
  | { kind: 'denied' }
  | { kind: 'failed' };

/**
 * Moves one file, renaming it where both places are on one disk and copying it across then
 * removing the original where they are not, since a rename cannot cross from one disk to another.
 *
 * @param from - Where it is.
 * @param to - Where it goes.
 */
const moveOne = async (from: string, to: string): Promise<void> => {
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

/**
 * Moves one media file from one library's folder into another's, at the same place under it, with
 * what was kept beside it for it alone — subtitles, an `.nfo`, its own artwork — and removes the
 * folders it leaves empty, stopping at the first library's own folder.
 *
 * A file that is not inside the first library is refused before anything is touched, and so is
 * one whose place in the second is already taken, so nothing there is ever written over. What the
 * disk refuses — a mount that is read-only, a folder Valence may not change — is told apart from
 * any other failure, since the fix for those is a setting on the machine.
 *
 * @param fromRoot - The folder of the library it is in.
 * @param path - The file.
 * @param toRoot - The folder of the library it goes to.
 * @returns Where it went, or why it did not.
 */
const moveMediaFile = async (
  fromRoot: string,
  path: string,
  toRoot: string,
): Promise<MediaFileMove> => {
  if (path === fromRoot || !isUnderAny(path, [fromRoot])) {
    return { kind: 'outside' };
  }

  const to = join(toRoot, relative(fromRoot, path));

  if ((await stat(to).catch(() => null)) !== null) {
    return { kind: 'taken' };
  }

  const folder = dirname(path);
  const stem = basename(path, extname(path));

  try {
    await moveOne(path, to);

    const beside = await readdir(folder).catch(() => []);

    for (const name of beside.filter((one) => isSidecarOf(one, stem))) {
      const sidecar = join(dirname(to), name);

      if ((await stat(sidecar).catch(() => null)) === null) {
        await moveOne(join(folder, name), sidecar);
      }
    }
  } catch (error) {
    return diskRefusalOf(error instanceof Error ? error : null);
  }

  await removeEmptyFoldersUpTo(folder, fromRoot);

  return { kind: 'moved', to };
};

export type { MediaFileMove };

export { moveMediaFile };
