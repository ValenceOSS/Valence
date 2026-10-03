import { readFromServer } from '@ValenceClient/query/readFromServer';
import { LinkedServerFacesSchema } from '@ValenceContracts/schemas/LinkSharing';
import type { LinkedServerFace } from '@ValenceContracts/schemas/LinkSharing';

/**
 * Reads the servers this one is linked with, as anybody here sees them beside what they share: each
 * one's name and colour, and whether it can be reached.
 *
 * @returns The servers.
 */
const fetchLinkedServerFaces = async (): Promise<LinkedServerFace[]> =>
  (await readFromServer('/api/linked-servers/faces', LinkedServerFacesSchema)).servers;

export { fetchLinkedServerFaces };
