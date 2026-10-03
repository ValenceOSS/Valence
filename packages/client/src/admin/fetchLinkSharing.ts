import { readFromServer } from '@ValenceClient/query/readFromServer';
import { LinkSharingSchema } from '@ValenceContracts/schemas/LinkSharing';
import type { LinkSharing } from '@ValenceContracts/schemas/LinkSharing';

/**
 * Reads what this server shares with a linked server: the libraries, the age, and what else its
 * admin allows it.
 *
 * @param id - The linked server.
 * @returns What it is shared.
 */
const fetchLinkSharing = (id: string): Promise<LinkSharing> =>
  readFromServer(`/api/linked-servers/${encodeURIComponent(id)}/sharing`, LinkSharingSchema);

export { fetchLinkSharing };
