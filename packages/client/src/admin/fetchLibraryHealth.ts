import { readFromServer } from '@ValenceClient/query/readFromServer';
import { LibraryHealthSchema } from '@ValenceContracts/schemas/LibraryHealth';
import type { LibraryHealth } from '@ValenceContracts/schemas/LibraryHealth';

/**
 * Reads what is wrong in the server's films and series.
 *
 * @returns Each problem, how many there are and the first hundred.
 */
const fetchLibraryHealth = (): Promise<LibraryHealth> =>
  readFromServer('/api/admin/library-health', LibraryHealthSchema);

export { fetchLibraryHealth };
