import { copyFile, mkdir, readdir, rename, rm, stat } from 'node:fs/promises';
import { basename, dirname, extname, join, relative } from 'node:path';
import { diskRefusalOf } from '@ValenceServer/files/diskRefusalOf';
import { isSidecarOf } from '@ValenceServer/library/isSidecarOf';
import { isMediaFile } from '@ValenceServer/library/isMediaFile';
import { readStackPart } from '@ValenceServer/library/naming/readStackPart';
import { isUnderAny } from '@ValenceServer/library/isUnderAny';
import { removeEmptyFoldersUpTo } from '@ValenceServer/library/removeEmptyFoldersUpTo';

type MediaFileMove =
  | { kind: 'moved'; to: string; laterTo: readonly string[] }
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
 * A film kept as several files moves whole: every part, each part's own subtitles, and what was
 * kept for the film by the name its parts share, unless another copy of the film still uses it.
 * Where one of its parts cannot be moved, the parts already moved are put back, so the film is
 * never left half in each library. A file that is not inside the first library is refused before
 * anything is touched, and so is one whose place in the second is already taken, so nothing there
 * is ever written over. What the disk refuses — a mount that is read-only, a folder Valence may not
 * change — is told apart from any other failure, since the fix for those is a setting on the
 * machine.
 *
 * @param fromRoot - The folder of the library it is in.
 * @param path - The file, or a split film's first part.
 * @param toRoot - The folder of the library it goes to.
 * @param laterParts - A split film's other parts, in order.
 * @returns Where it went, or why it did not.
 */
const moveMediaFile = async (
  fromRoot: string,
  path: string,
  toRoot: string,
  laterParts: readonly string[] = [],
): Promise<MediaFileMove> => {
  const paths = [path, ...laterParts];

  if (paths.some((one) => one === fromRoot || !isUnderAny(one, [fromRoot]))) {
    return { kind: 'outside' };
  }

  const moves = paths.map((from) => ({ from, to: join(toRoot, relative(fromRoot, from)) }));
  const taken = await Promise.all(
    moves.map(async (move) => (await stat(move.to).catch(() => null)) !== null),
  );

  if (taken.includes(true)) {
    return { kind: 'taken' };
  }

  const shared = laterParts.length > 0 ? readStackPart(basename(path))?.name : undefined;
  const folders = [...new Set(paths.map((one) => dirname(one)))];

  const moved: typeof moves = [];

  try {
    for (const move of moves) {
      await moveOne(move.from, move.to);
      moved.push(move);
    }
  } catch (error) {
    for (const move of moved.toReversed()) {
      await moveOne(move.to, move.from).catch(() => undefined);
    }

    return diskRefusalOf(error instanceof Error ? error : null);
  }

  try {
    for (const folder of folders) {
      const beside: string[] = await readdir(folder).catch(() => []);
      const stems = paths
        .filter((one) => dirname(one) === folder)
        .map((one) => basename(one, extname(one)));
      const named =
        shared === undefined || beside.some((name) => name.startsWith(shared) && isMediaFile(name))
          ? stems
          : [...stems, shared];
      const to = join(toRoot, relative(fromRoot, folder));

      for (const name of beside.filter((one) => named.some((stem) => isSidecarOf(one, stem)))) {
        const sidecar = join(to, name);

        if ((await stat(sidecar).catch(() => null)) === null) {
          await moveOne(join(folder, name), sidecar);
        }
      }
    }
  } catch (error) {
    return diskRefusalOf(error instanceof Error ? error : null);
  }

  for (const folder of folders) {
    await removeEmptyFoldersUpTo(folder, fromRoot);
  }

  const [to = path, ...laterTo] = moves.map((move) => move.to);

  return { kind: 'moved', to, laterTo };
};

export type { MediaFileMove };

export { moveMediaFile };
