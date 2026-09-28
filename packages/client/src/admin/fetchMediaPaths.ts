import { readFromServer } from '@ValenceClient/query/readFromServer';
import { MediaPathsSchema } from '@ValenceContracts/schemas/LibraryFiles';

/**
 * Where on the disk each item in a library is, for an administrator.
 *
 * @param libraryId - The library.
 * @returns Each item's file, by the item.
 */
const fetchMediaPaths = async (libraryId: string): Promise<Record<string, string>> =>
  (
    await readFromServer(
      `/api/admin/files/media?${new URLSearchParams({ libraryId }).toString()}`,
      MediaPathsSchema,
    )
  ).paths;

export { fetchMediaPaths };
