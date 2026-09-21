import { isAbsolute, join, resolve } from 'node:path';
import type { Folder } from '@ValenceContracts/schemas/Folder';
import type { FolderDisk } from '@ValenceServer/folders/FolderDisk';

const LONGEST_NAME = 255;

type FolderCreation =
  | { kind: 'created'; folder: Folder }
  | { kind: 'relative' }
  | { kind: 'badName' }
  | { kind: 'exists' }
  | { kind: 'missing' }
  | { kind: 'readOnly' }
  | { kind: 'denied' };

/**
 * Whether a name can be a single folder's name: something, not a way of walking to somewhere else,
 * and free of the characters a path is built from.
 *
 * @param name - What somebody typed.
 * @returns Whether it will do.
 */
const isFolderName = (name: string): boolean =>
  name !== '' &&
  name.length <= LONGEST_NAME &&
  name !== '.' &&
  name !== '..' &&
  !/[/\\\0]/.test(name);

/**
 * Makes a new folder inside one on the machine running Valence, so an administrator can set up where
 * media will live from the same place they choose it, without a terminal.
 *
 * One folder at a time and only directly inside a folder that already exists: the name is a single
 * name, never a path, so nothing typed here can climb out of the folder it was asked to make it in,
 * and a parent that is not there is reported rather than built. What the disk refuses — a drive
 * mounted read-only, a folder Valence may not write to — comes back as what it is, since the fix is
 * a setting on the machine and not something to try again.
 *
 * @param disk - How to reach the disk, which a test replaces.
 * @param parent - The folder to make it in, starting from the root.
 * @param requested - What to call it.
 * @returns The folder made, or why it could not be.
 */
const createFolder = async (
  disk: FolderDisk,
  parent: string,
  requested: string,
): Promise<FolderCreation> => {
  if (!isAbsolute(parent)) {
    return { kind: 'relative' };
  }

  const name = requested.trim();

  if (!isFolderName(name)) {
    return { kind: 'badName' };
  }

  const path = join(resolve(parent), name);
  const made = await disk.makeDirectory(path);

  return made === 'made' ? { kind: 'created', folder: { name, path } } : { kind: made };
};

export type { FolderCreation };

export { createFolder };
