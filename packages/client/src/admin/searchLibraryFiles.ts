import { readFromServer } from '@ValenceClient/query/readFromServer';
import { LibraryFileSearchSchema } from '@ValenceContracts/schemas/LibraryFiles';
import type { LibraryFileSearch } from '@ValenceContracts/schemas/LibraryFiles';

/**
 * Finds files and folders inside the libraries whose names hold some words, a few levels below a
 * folder — or below every library, where none is named.
 *
 * @param words - What the names should hold.
 * @param within - The folder to look below, or nothing for every library.
 * @returns What was found, nearest first.
 */
const searchLibraryFiles = (words: string, within: string | null): Promise<LibraryFileSearch> =>
  readFromServer(
    `/api/admin/files/search?${new URLSearchParams(within === null ? { words } : { words, within }).toString()}`,
    LibraryFileSearchSchema,
  );

export { searchLibraryFiles };
