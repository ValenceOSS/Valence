import { isAbsolute, resolve } from 'node:path';
import { findByName } from '@ValenceServer/folders/findByName';
import type { FolderSearch } from '@ValenceContracts/schemas/Folder';
import type { FolderDisk } from '@ValenceServer/folders/FolderDisk';

type FolderSearchAnswer = { kind: 'found'; search: FolderSearch } | { kind: 'relative' };

/**
 * Finds the folders whose names hold some words, below a folder on the machine running Valence — or,
 * asked from nowhere in particular, below each place worth starting from but the top of the disk —
 * so whoever adds a library can find where it lives without walking down to it.
 *
 * The nearest are looked at first and listed first, a few levels down at most, and it stops once it
 * has found enough or read enough folders, saying so, since a disk of media can hold more folders
 * than anybody should wait for. See `findByName`.
 *
 * @param disk - How to read the disk, which a test replaces.
 * @param words - What the names should hold, in any case.
 * @param within - The folder to look below, or nothing for the places to start from.
 * @returns The folders found, nearest first.
 */
const searchFolders = async (
  disk: FolderDisk,
  words: string,
  within?: string,
): Promise<FolderSearchAnswer> => {
  if (within !== undefined && within.trim() !== '' && !isAbsolute(within)) {
    return { kind: 'relative' };
  }

  const starts =
    within === undefined || within.trim() === ''
      ? (await disk.roots()).filter((root) => resolve(root) !== resolve('/'))
      : [resolve(within)];

  const { found, isTruncated } = await findByName(disk, words, starts, false);

  return {
    kind: 'found',
    search: { folders: found.map(({ name, path }) => ({ name, path })), isTruncated },
  };
};

export type { FolderSearchAnswer };

export { searchFolders };
