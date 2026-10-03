import { readFromServer } from '@ValenceClient/query/readFromServer';
import { TheirLibrariesSchema } from '@ValenceContracts/schemas/LinkSharing';
import type { TheirLibraries } from '@ValenceContracts/schemas/LinkSharing';

/**
 * Asks a linked server, through this one, what it shares with this server.
 *
 * @param id - The linked server.
 * @returns Its libraries, or that it could not be reached.
 */
const fetchTheirLibraries = (id: string): Promise<TheirLibraries> =>
  readFromServer(
    `/api/linked-servers/${encodeURIComponent(id)}/their-libraries`,
    TheirLibrariesSchema,
  );

export { fetchTheirLibraries };
