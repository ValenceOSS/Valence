import { readFromServer } from '@ValenceClient/query/readFromServer';
import { LibraryProblemsSchema } from '@ValenceContracts/schemas/TitleList';
import type { LibraryProblems } from '@ValenceContracts/schemas/TitleList';

/**
 * Counts the titles in each library that need a look, for saying so beside each library's name.
 *
 * @returns How many in each library.
 */
const fetchLibraryProblems = (): Promise<LibraryProblems> =>
  readFromServer('/api/admin/titles/problems', LibraryProblemsSchema);

export { fetchLibraryProblems };
