import { resolve } from 'node:path';
import { findByName } from '@ValenceServer/folders/findByName';
import { libraryOf } from '@ValenceServer/files/libraryOf';
import { staysInsideLibrary } from '@ValenceServer/files/staysInsideLibrary';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { LibraryFileSearch } from '@ValenceContracts/schemas/LibraryFiles';
import type { FolderDisk } from '@ValenceServer/folders/FolderDisk';
import type { EntryDescription, ListedEntry } from '@ValenceServer/files/describeLibraryEntries';

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
 * @param describe - Says what each entry found is to its library.
 * @returns What was found, or why it would not look.
 */
const searchLibraryFiles = async (
  disk: FolderDisk,
  libraries: readonly Library[],
  words: string,
  within: string | undefined,
  describe: (entries: readonly ListedEntry[]) => Promise<Record<string, EntryDescription>>,
): Promise<LibraryFileSearchAnswer> => {
  const isEverywhere = within === undefined || within.trim() === '';

  if (!isEverywhere) {
    const library = libraryOf(libraries, within);

    if (library === null || !(await staysInsideLibrary(library, within))) {
      return { kind: 'outside' };
    }
  }

  const { found, isTruncated } = await findByName(
    disk,
    words,
    isEverywhere ? libraries.map((library) => library.path) : [resolve(within)],
    true,
  );
  const known = await describe(found);

  return {
    kind: 'found',
    search: {
      entries: found.map((one) => ({
        ...one,
        sizeBytes: null,
        modifiedAt: null,
        mediaId: null,
        ...known[one.path],
      })),
      isTruncated,
    },
  };
};

export type { LibraryFileSearchAnswer };

export { searchLibraryFiles };
