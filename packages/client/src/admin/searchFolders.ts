import { readFromServer } from '@ValenceClient/query/readFromServer';
import { FolderSearchSchema } from '@ValenceContracts/schemas/Folder';
import type { FolderSearch } from '@ValenceContracts/schemas/Folder';

/**
 * Finds folders on the machine running Valence whose names hold some words, a few levels below a
 * folder — or below the places worth starting from, where none is named — for an administrator
 * choosing where a library lives.
 *
 * @param words - What the names should hold.
 * @param within - The folder to look below, or nothing for the places to start from.
 * @returns The folders found, nearest first.
 */
const searchFolders = async (words: string, within: string | null): Promise<FolderSearch> =>
  readFromServer(
    `/api/admin/folders/search?${new URLSearchParams(within === null ? { words } : { words, within }).toString()}`,
    FolderSearchSchema,
  );

export { searchFolders };
