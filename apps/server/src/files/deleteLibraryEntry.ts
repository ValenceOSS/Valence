import { lstat, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { diskRefusalOf } from '@ValenceServer/files/diskRefusalOf';
import { libraryOf } from '@ValenceServer/files/libraryOf';
import { staysInsideLibrary } from '@ValenceServer/files/staysInsideLibrary';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { LibraryEntryChange } from '@ValenceServer/files/LibraryEntryChange';

/**
 * Deletes a file, or a folder with everything in it, from inside a library. A library's own folder
 * is never deleted this way — that is what removing the library is for — and nothing outside a
 * library is touched at all. A link is deleted as the link, never what it leads to, and a path through a link that leads out of
 * the library is refused.
 *
 * @param libraries - The libraries there are.
 * @param path - What to delete.
 * @returns What changed, or why nothing did.
 */
const deleteLibraryEntry = async (
  libraries: readonly Library[],
  path: string,
): Promise<LibraryEntryChange> => {
  const at = resolve(path);
  const library = libraryOf(libraries, at);

  if (library !== null && at === resolve(library.path)) {
    return { kind: 'root' };
  }

  if (library === null || !(await staysInsideLibrary(library, dirname(at)))) {
    return { kind: 'outside' };
  }

  try {
    await lstat(at);
    await rm(at, { recursive: true });

    return { kind: 'changed', path: at, libraryIds: [library.id] };
  } catch (error) {
    return diskRefusalOf(error instanceof Error ? error : null);
  }
};

export { deleteLibraryEntry };
