import { readFromServer } from '@ValenceClient/query/readFromServer';
import { OrphanedEditsSchema } from '@ValenceContracts/schemas/OrphanedEdits';
import type { OrphanedEdits } from '@ValenceContracts/schemas/OrphanedEdits';

/**
 * Lists the titles of a library whose edits are kept though their files have gone.
 *
 * @param libraryId - The library.
 * @returns The titles gone, with what is kept for each.
 */
const fetchOrphanedEdits = (libraryId: string): Promise<OrphanedEdits> =>
  readFromServer(
    `/api/admin/titles/orphans?${new URLSearchParams({ libraryId }).toString()}`,
    OrphanedEditsSchema,
  );

export { fetchOrphanedEdits };
