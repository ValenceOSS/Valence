import { readFromServer } from '@ValenceClient/query/readFromServer';
import { LinkedServerFacesSchema } from '@ValenceContracts/schemas/LinkSharing';
import type { ThisServerFace } from '@ValenceContracts/schemas/LinkSharing';

/**
 * Reads how this server is shown beside the servers it is linked with: its name, its colour and
 * when its picture last changed.
 *
 * @returns This server's face, or null from a server too old to say.
 */
const fetchThisServerFace = async (): Promise<ThisServerFace | null> =>
  (await readFromServer('/api/linked-servers/faces', LinkedServerFacesSchema)).here;

export { fetchThisServerFace };
