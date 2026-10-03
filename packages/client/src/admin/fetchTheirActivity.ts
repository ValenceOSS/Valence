import { readFromServer } from '@ValenceClient/query/readFromServer';
import { TheirActivitySchema } from '@ValenceContracts/schemas/LinkSharing';
import type { TheirActivity } from '@ValenceContracts/schemas/LinkSharing';

/**
 * Asks a linked server, through this one, for its record of this server's people.
 *
 * @param id - The linked server.
 * @returns Its record, or why there is none.
 */
const fetchTheirActivity = (id: string): Promise<TheirActivity> =>
  readFromServer(
    `/api/linked-servers/${encodeURIComponent(id)}/their-activity`,
    TheirActivitySchema,
  );

export { fetchTheirActivity };
