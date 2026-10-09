import { readFromServer } from '@ValenceClient/query/readFromServer';
import { FolderMeasureSchema } from '@ValenceContracts/schemas/LibraryFiles';
import type { FolderMeasure } from '@ValenceContracts/schemas/LibraryFiles';

/**
 * Reads how much a folder inside a library takes on the disk, and how many files and folders it
 * holds, folders within folders.
 *
 * @param path - The folder.
 * @returns What it holds.
 */
const fetchFolderMeasure = (path: string): Promise<FolderMeasure> =>
  readFromServer(
    `/api/admin/files/measure?${new URLSearchParams({ path }).toString()}`,
    FolderMeasureSchema,
  );

export { fetchFolderMeasure };
