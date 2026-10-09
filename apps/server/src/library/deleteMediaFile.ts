import { readdir, rm } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';
import { isSidecarOf } from '@ValenceServer/library/isSidecarOf';
import { removeEmptyFoldersUpTo } from '@ValenceServer/library/removeEmptyFoldersUpTo';
import { isUnderAny } from '@ValenceServer/library/isUnderAny';
import { diskRefusalOf } from '@ValenceServer/files/diskRefusalOf';

type MediaFileDeletion =
  | { kind: 'deleted' }
  | { kind: 'outside' }
  | { kind: 'readOnly' }
  | { kind: 'denied' }
  | { kind: 'failed' };

/**
 * Deletes one media file from its library's disk, with what was kept beside it for it alone —
 * subtitles, an `.nfo`, its own artwork — and the folders it leaves empty on the way up, stopping at
 * the library's own folder.
 *
 * The copies Valence made of it and kept alongside go too, beside it or in the library's Valence
 * folder, since they belong to it and to nothing else. A file already gone counts as deleted, since
 * that was what was asked. A path that is not inside
 * the library is refused before anything is touched, whatever the catalogue says, so a row that
 * went wrong can never reach past the folder it was scanned from. What the disk refuses — a mount
 * that is read-only, a folder Valence may not change — is told apart from any other failure, since
 * the fix for those two is a setting on the machine.
 *
 * @param root - The library's folder.
 * @param path - The file.
 * @param keptCopies - The copies Valence kept of it, which go once it has.
 * @returns Whether it went, and why not where it did not.
 */
const deleteMediaFile = async (
  root: string,
  path: string,
  keptCopies: readonly string[] = [],
): Promise<MediaFileDeletion> => {
  if (path === root || !isUnderAny(path, [root])) {
    return { kind: 'outside' };
  }

  const folder = dirname(path);
  const stem = basename(path, extname(path));

  try {
    await rm(path, { force: true });

    const beside = await readdir(folder).catch(() => []);

    await Promise.all([
      ...beside
        .filter((name) => isSidecarOf(name, stem))
        .map((name) => rm(join(folder, name), { force: true })),
      ...keptCopies
        .filter((copy) => copy !== root && isUnderAny(copy, [root]))
        .map((copy) => rm(copy, { force: true })),
    ]);
  } catch (error) {
    const refusal = diskRefusalOf(error instanceof Error ? error : null);

    return refusal.kind === 'missing' ? { kind: 'failed' } : refusal;
  }

  await removeEmptyFoldersUpTo(folder, root);

  return { kind: 'deleted' };
};

export type { MediaFileDeletion };

export { deleteMediaFile };
