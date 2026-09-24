import { resolve } from 'node:path';
import { findByName } from '@ValenceServer/folders/findByName';
import { libraryOf } from '@ValenceServer/files/libraryOf';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { LibraryFileSearch } from '@ValenceContracts/schemas/LibraryFiles';
import type { FolderDisk } from '@ValenceServer/folders/FolderDisk';

type LibraryFileSearchAnswer = { kind: 'found'; search: LibraryFileSearch } | { kind: 'outside' };

/**
 * Finds the files and folders whose names hold some words, a few levels below a folder inside a
 * library — or below every library, asked from nowhere in particular. Nearest first, and capped
 * the way the folder search is; see `findByName`.
 *
 * @param disk - How to read the disk.
 * @param libraries - The libraries there are.
 * @param words - What the names should hold, in any case.
 * @param within - The folder to look below, or nothing for every library.
 * @param mediaIdsAt - Which of some paths are items in the catalogue, and which items.
 * @returns What was found, or why it would not look.
 */
const searchLibraryFiles = async (
  disk: FolderDisk,
  libraries: readonly Library[],
  words: string,
  within: string | undefined,
  mediaIdsAt: (paths: string[]) => Promise<Record<string, string>>,
): Promise<LibraryFileSearchAnswer> => {
  const isEverywhere = within === undefined || within.trim() === '';

  if (!isEverywhere && libraryOf(libraries, within) === null) {
    return { kind: 'outside' };
  }

  const { found, isTruncated } = await findByName(
    disk,
    words,
    isEverywhere ? libraries.map((library) => library.path) : [resolve(within)],
    true,
  );
  const known = await mediaIdsAt(found.filter((one) => !one.isFolder).map((one) => one.path));

  return {
    kind: 'found',
    search: {
      entries: found.map((one) => ({
        ...one,
        sizeBytes: null,
        modifiedAt: null,
        mediaId: known[one.path] ?? null,
      })),
      isTruncated,
    },
  };
};

export type { LibraryFileSearchAnswer };

export { searchLibraryFiles };
