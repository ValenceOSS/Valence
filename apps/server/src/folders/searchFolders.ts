import { isAbsolute, join, resolve } from 'node:path';
import type { Folder, FolderSearch } from '@ValenceContracts/schemas/Folder';
import type { FolderDisk } from '@ValenceServer/folders/FolderDisk';

const DEEPEST = 4;

const MOST_FOUND = 200;

const MOST_READ = 5000;

type FolderSearchAnswer = { kind: 'found'; search: FolderSearch } | { kind: 'relative' };

/**
 * Finds the folders whose names hold some words, below a folder on the machine running Valence — or,
 * asked from nowhere in particular, below each place worth starting from but the top of the disk —
 * so whoever adds a library can find where it lives without walking down to it.
 *
 * The nearest are looked at first and listed first, a few levels down at most, and it stops once it
 * has found enough or read enough folders, saying so, since a disk of media can hold more folders
 * than anybody should wait for. A folder whose name starts with a dot is neither looked in nor
 * found, and a link is not followed, so a link that leads back up can never send it round in a
 * circle. A folder it may not read is passed over rather than ending the search.
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

  const wanted = words.trim().toLowerCase();
  const starts =
    within === undefined || within.trim() === ''
      ? (await disk.roots()).filter((root) => resolve(root) !== resolve('/'))
      : [resolve(within)];

  const found: Folder[] = [];
  let level = starts;
  let read = 0;
  let isTruncated = false;

  for (let depth = 1; depth <= DEEPEST && level.length > 0 && !isTruncated; depth += 1) {
    const next: string[] = [];

    for (const folder of level) {
      if (read >= MOST_READ || found.length >= MOST_FOUND) {
        isTruncated = true;
        break;
      }

      read += 1;

      const listed = await disk.readDirectory(folder);

      if (listed.kind !== 'read') {
        continue;
      }

      const inside = listed.entries
        .filter((entry) => entry.isDirectory && !entry.name.startsWith('.'))
        .map((entry) => ({ name: entry.name, path: join(folder, entry.name) }))
        .sort((left, right) =>
          left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: 'base' }),
        );

      found.push(...inside.filter((entry) => entry.name.toLowerCase().includes(wanted)));
      next.push(...inside.map((entry) => entry.path));
    }

    level = next;
  }

  return {
    kind: 'found',
    search: {
      folders: found.slice(0, MOST_FOUND),
      isTruncated: isTruncated || found.length > MOST_FOUND,
    },
  };
};

export type { FolderSearchAnswer };

export { searchFolders };
