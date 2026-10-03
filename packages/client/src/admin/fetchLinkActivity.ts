import { readFromServer } from '@ValenceClient/query/readFromServer';
import { FederationActivityListSchema } from '@ValenceContracts/schemas/LinkSharing';
import type { FederationActivity } from '@ValenceContracts/schemas/LinkSharing';

/**
 * Reads this server's record of what a linked server and its people asked for, newest first.
 *
 * @param id - The linked server.
 * @returns The record.
 */
const fetchLinkActivity = async (id: string): Promise<FederationActivity[]> =>
  (
    await readFromServer(
      `/api/linked-servers/${encodeURIComponent(id)}/activity`,
      FederationActivityListSchema,
    )
  ).entries;

export { fetchLinkActivity };
