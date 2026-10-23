import { readdir, rm } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';
import { isSidecarOf } from '@ValenceServer/library/isSidecarOf';
import { isMediaFile } from '@ValenceServer/library/isMediaFile';
import { readStackPart } from '@ValenceServer/library/naming/readStackPart';
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
 * folder, since they belong to it and to nothing else. A film kept as several files goes whole: every
 * part, each part's own subtitles, and what was kept for the film by the name its parts share, unless
 * another copy of the film still uses it. A file already gone counts as deleted, since that was
 * what was asked. A path that is not inside the library is refused before anything is touched,
 * whatever the catalogue says, so a row that went wrong can never reach past the folder it was
 * scanned from. What the disk refuses — a mount that is read-only, a folder Valence may not
 * change — is told apart from any other failure, since the fix for those two is a setting on the
 * machine.
 *
 * @param root - The library's folder.
 * @param path - The file, or a split film's first part.
 * @param keptCopies - The copies Valence kept of it, which go once it has.
 * @param laterParts - A split film's other parts, in order.
 * @returns Whether it went, and why not where it did not.
 */
const deleteMediaFile = async (
  root: string,
  path: string,
  keptCopies: readonly string[] = [],
  laterParts: readonly string[] = [],
): Promise<MediaFileDeletion> => {
  const paths = [path, ...laterParts];

  if (paths.some((one) => one === root || !isUnderAny(one, [root]))) {
    return { kind: 'outside' };
  }

  const folders = [...new Set(paths.map((one) => dirname(one)))];
  const stems = paths.map((one) => basename(one, extname(one)));
  const shared = laterParts.length > 0 ? readStackPart(basename(path))?.name : undefined;

  try {
    await Promise.all(paths.map((one) => rm(one, { force: true })));

    for (const folder of folders) {
      const beside: string[] = await readdir(folder).catch(() => []);
      const named =
        shared === undefined || beside.some((name) => name.startsWith(shared) && isMediaFile(name))
          ? stems
          : [...stems, shared];

      await Promise.all(
        beside
          .filter((name) => named.some((stem) => isSidecarOf(name, stem)))
          .map((name) => rm(join(folder, name), { force: true })),
      );
    }

    await Promise.all(
      keptCopies
        .filter((copy) => copy !== root && isUnderAny(copy, [root]))
        .map((copy) => rm(copy, { force: true })),
    );
  } catch (error) {
    const refusal = diskRefusalOf(error instanceof Error ? error : null);

    return refusal.kind === 'missing' ? { kind: 'failed' } : refusal;
  }

  for (const folder of folders) {
    await removeEmptyFoldersUpTo(folder, root);
  }

  return { kind: 'deleted' };
};

export type { MediaFileDeletion };

export { deleteMediaFile };
