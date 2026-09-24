import { join } from 'node:path';
import type { FolderDisk } from '@ValenceServer/folders/FolderDisk';

const DEEPEST = 4;

const MOST_FOUND = 200;

const MOST_READ = 5000;

type FoundByName = { name: string; path: string; isFolder: boolean };

/**
 * Finds what is named with some words below a set of folders, nearest first, looking a few levels
 * down at most and stopping once it has found enough or read enough folders, saying which.
 *
 * A folder whose name starts with a dot is neither looked in nor found, and a link is not followed,
 * so a link that leads back up can never send it round in a circle. A folder it may not read is
 * passed over rather than ending the search.
 *
 * @param disk - How to read the disk.
 * @param words - What the names should hold, in any case.
 * @param starts - The folders to look below.
 * @param isFileWanted - Whether files are found as well as folders.
 * @returns What was found, nearest first, and whether it stopped before looking everywhere.
 */
const findByName = async (
  disk: FolderDisk,
  words: string,
  starts: readonly string[],
  isFileWanted: boolean,
): Promise<{ found: FoundByName[]; isTruncated: boolean }> => {
  const wanted = words.trim().toLowerCase();
  const found: FoundByName[] = [];
  let level = [...starts];
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
        .filter((entry) => !entry.isSymbolicLink && !entry.name.startsWith('.'))
        .map((entry) => ({
          name: entry.name,
          path: join(folder, entry.name),
          isFolder: entry.isDirectory,
        }))
        .sort((left, right) =>
          left.isFolder === right.isFolder
            ? left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: 'base' })
            : left.isFolder
              ? -1
              : 1,
        );

      found.push(
        ...inside.filter(
          (entry) => (entry.isFolder || isFileWanted) && entry.name.toLowerCase().includes(wanted),
        ),
      );
      next.push(...inside.filter((entry) => entry.isFolder).map((entry) => entry.path));
    }

    level = next;
  }

  return {
    found: found.slice(0, MOST_FOUND),
    isTruncated: isTruncated || found.length > MOST_FOUND,
  };
};

export type { FoundByName };

export { findByName };
