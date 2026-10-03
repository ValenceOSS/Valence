import { z } from 'zod';
import { readFromServer } from '@ValenceClient/query/readFromServer';
import { LeftOutSchema } from '@ValenceContracts/schemas/LeftOut';
import type { LeftOut } from '@ValenceContracts/schemas/LeftOut';

/**
 * Reads the files and folders an administrator has left out of a library's scans.
 *
 * @param libraryId - The library.
 * @returns What is left out, by path.
 */
const fetchLeftOut = (libraryId: string): Promise<LeftOut[]> =>
  readFromServer(`/api/libraries/${libraryId}/left-out`, z.array(LeftOutSchema));

export { fetchLeftOut };
