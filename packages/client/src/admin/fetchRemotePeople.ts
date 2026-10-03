import { readFromServer } from '@ValenceClient/query/readFromServer';
import { RemotePeopleSchema } from '@ValenceContracts/schemas/LinkSharing';
import type { RemotePerson } from '@ValenceContracts/schemas/LinkSharing';

/**
 * Reads the people from a linked server this one has seen, most recently seen first.
 *
 * @param id - The linked server.
 * @returns The people.
 */
const fetchRemotePeople = async (id: string): Promise<RemotePerson[]> =>
  (await readFromServer(`/api/linked-servers/${encodeURIComponent(id)}/people`, RemotePeopleSchema))
    .people;

export { fetchRemotePeople };
