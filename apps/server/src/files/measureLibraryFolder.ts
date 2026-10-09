import { readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { diskRefusalOf } from '@ValenceServer/files/diskRefusalOf';
import { libraryOf } from '@ValenceServer/files/libraryOf';
import type { DiskRefusal } from '@ValenceServer/files/diskRefusalOf';
import type { FolderMeasure } from '@ValenceContracts/schemas/LibraryFiles';
import type { Library } from '@ValenceContracts/schemas/Library';

const MOST_COUNTED = 200_000;

type FolderMeasureAnswer =
  | { kind: 'measured'; measure: FolderMeasure }
  | { kind: 'outside' }
  | DiskRefusal;

/**
 * Adds up everything inside a folder of a library, folders within folders: how much it takes on
 * the disk and how many files and folders it holds. Hidden files are passed over as the file
 * manager passes over them. A folder holding more than can be counted in a moment is counted as far
 * as that, and said to be counted only in part, rather than holding the page up.
 *
 * @param libraries - Every library, one of which the folder must be inside.
 * @param path - The folder.
 * @returns What it holds, or why it could not be measured.
 */
const measureLibraryFolder = async (
  libraries: readonly Library[],
  path: string,
): Promise<FolderMeasureAnswer> => {
  const at = resolve(path);

  if (libraryOf(libraries, at) === null) {
    return { kind: 'outside' };
  }

  const measure = { sizeBytes: 0, files: 0, folders: 0, isPartial: false };
  const waiting = [at];

  try {
    await readdir(at);
  } catch (error) {
    return diskRefusalOf(error instanceof Error ? error : null);
  }

  while (waiting.length > 0) {
    const folder = waiting.pop() ?? at;
    const names = await readdir(folder).catch(() => []);

    for (const name of names.filter((one) => !one.startsWith('.'))) {
      if (measure.files + measure.folders >= MOST_COUNTED) {
        return { kind: 'measured', measure: { ...measure, isPartial: true } };
      }

      const full = join(folder, name);
      const found = await stat(full).catch(() => null);

      if (found?.isDirectory() === true) {
        measure.folders += 1;
        waiting.push(full);
      } else if (found !== null) {
        measure.files += 1;
        measure.sizeBytes += found.size;
      }
    }
  }

  return { kind: 'measured', measure };
};

export type { FolderMeasureAnswer };

export { measureLibraryFolder };
