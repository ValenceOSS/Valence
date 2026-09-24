import { access, rename, stat } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { diskRefusalOf } from '@ValenceServer/files/diskRefusalOf';
import { libraryOf } from '@ValenceServer/files/libraryOf';
import { isUnderAny } from '@ValenceServer/library/isUnderAny';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { LibraryEntryChange } from '@ValenceServer/files/LibraryEntryChange';

/**
 * Whether something is already at a path.
 *
 * @param path - Where to look.
 * @returns Whether anything is there.
 */
const isThere = (path: string): Promise<boolean> =>
  access(path).then(
    () => true,
    () => false,
  );

/**
 * Moves a file or folder into another folder, keeping its name — or, given a new name, renames it
 * where it is. Both ends must be inside a library, though not the same one, and a library's own
 * folder is never moved. Nothing already there is replaced, a folder is never moved into itself,
 * and a move between two disks is refused rather than copied, since copying a film is a long job
 * and not what a rename should quietly become.
 *
 * @param libraries - The libraries there are.
 * @param path - What to move.
 * @param to - Where: the folder to move it into, or its new name where it stays.
 * @returns What changed, or why nothing did.
 */
const moveLibraryEntry = async (
  libraries: readonly Library[],
  path: string,
  to: { into: string } | { name: string },
): Promise<LibraryEntryChange> => {
  const from = resolve(path);
  const source = libraryOf(libraries, from);

  if (source === null) {
    return { kind: 'outside' };
  }

  if (from === resolve(source.path)) {
    return { kind: 'root' };
  }

  if (
    'name' in to &&
    (to.name.trim() === '' ||
      to.name === '.' ||
      to.name === '..' ||
      /[\\/]/.test(to.name) ||
      to.name !== to.name.trim())
  ) {
    return { kind: 'badName' };
  }

  const into = 'into' in to ? resolve(to.into) : dirname(from);
  const target = libraryOf(libraries, into);
  const destination = join(into, 'name' in to ? to.name : basename(from));

  if (target === null) {
    return { kind: 'outside' };
  }

  if (isUnderAny(into, [from])) {
    return { kind: 'intoItself' };
  }

  try {
    if (!(await stat(into)).isDirectory()) {
      return { kind: 'missing' };
    }

    if (destination !== from && (await isThere(destination))) {
      return { kind: 'exists' };
    }

    await rename(from, destination);

    return {
      kind: 'changed',
      path: destination,
      libraryIds: [...new Set([source.id, target.id])],
    };
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'EXDEV') {
      return { kind: 'otherDisk' };
    }

    return diskRefusalOf(error instanceof Error ? error : null);
  }
};

export { moveLibraryEntry };
