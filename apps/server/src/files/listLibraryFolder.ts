import { readdir, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { diskRefusalOf } from '@ValenceServer/files/diskRefusalOf';
import { libraryOf } from '@ValenceServer/files/libraryOf';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { LibraryEntry, LibraryFolder } from '@ValenceContracts/schemas/LibraryFiles';
import type { DiskRefusal } from '@ValenceServer/files/diskRefusalOf';

const MOST_LISTED = 2000;

type LibraryFolderAnswer =
  { kind: 'listed'; folder: LibraryFolder } | { kind: 'outside' } | DiskRefusal;

/**
 * Lists what is in a folder inside a library — or, asked about nothing, the libraries themselves —
 * for the file manager: folders first, then files, each with its size and when it last changed,
 * and for a file Valence has in its catalogue, which item it is.
 *
 * Only what is inside a library is listed; a path anywhere else is refused, since the file manager
 * is for media and not for the machine. A name starting with a dot is left out, as every file
 * manager does, and a link is followed to what it leads to. The folder above a library's own folder
 * is the list of libraries.
 *
 * @param libraries - The libraries there are.
 * @param path - The folder, or nothing for the libraries.
 * @param mediaIdsAt - Which of some paths are items in the catalogue, and which items.
 * @returns What is in it, or why it could not be listed.
 */
const listLibraryFolder = async (
  libraries: readonly Library[],
  path: string | undefined,
  mediaIdsAt: (paths: string[]) => Promise<Record<string, string>>,
): Promise<LibraryFolderAnswer> => {
  if (path === undefined || path.trim() === '') {
    return {
      kind: 'listed',
      folder: {
        path: null,
        parent: null,
        libraryId: null,
        libraryPath: null,
        entries: libraries.map((library) => ({
          name: library.name,
          path: library.path,
          isFolder: true,
          sizeBytes: null,
          modifiedAt: null,
          mediaId: null,
        })),
        isTruncated: false,
      },
    };
  }

  const at = resolve(path);
  const library = libraryOf(libraries, at);

  if (library === null) {
    return { kind: 'outside' };
  }

  try {
    const names = (await readdir(at)).filter((name) => !name.startsWith('.'));
    const read = await Promise.all(
      names.map(async (name): Promise<Omit<LibraryEntry, 'mediaId'> | null> => {
        const full = join(at, name);
        const found = await stat(full).catch(() => null);

        return found === null
          ? null
          : {
              name,
              path: full,
              isFolder: found.isDirectory(),
              sizeBytes: found.isDirectory() ? null : found.size,
              modifiedAt: found.mtime.toISOString(),
            };
      }),
    );
    const entries = read
      .filter((entry) => entry !== null)
      .sort((left, right) =>
        left.isFolder === right.isFolder
          ? left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: 'base' })
          : left.isFolder
            ? -1
            : 1,
      )
      .slice(0, MOST_LISTED);
    const known = await mediaIdsAt(
      entries.filter((entry) => !entry.isFolder).map((entry) => entry.path),
    );

    return {
      kind: 'listed',
      folder: {
        path: at,
        parent: at === resolve(library.path) ? null : dirname(at),
        libraryId: library.id,
        libraryPath: library.path,
        entries: entries.map((entry) => ({ ...entry, mediaId: known[entry.path] ?? null })),
        isTruncated: read.length > MOST_LISTED,
      },
    };
  } catch (error) {
    return diskRefusalOf(error instanceof Error ? error : null);
  }
};

export type { LibraryFolderAnswer };

export { listLibraryFolder };
