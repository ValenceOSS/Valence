import { readFromServer } from '@ValenceClient/query/readFromServer';
import { LibraryFolderSchema } from '@ValenceContracts/schemas/LibraryFiles';
import type { LibraryFolder } from '@ValenceContracts/schemas/LibraryFiles';

/**
 * What is in a folder inside a library, or the libraries themselves where none is named, for the
 * file manager.
 *
 * @param path - The folder, or nothing for the libraries.
 * @returns What is in it, folders first.
 */
const fetchLibraryFolder = (path: string | null): Promise<LibraryFolder> =>
  readFromServer(
    path === null
      ? '/api/admin/files'
      : `/api/admin/files?${new URLSearchParams({ path }).toString()}`,
    LibraryFolderSchema,
  );

export { fetchLibraryFolder };
