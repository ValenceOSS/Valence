import { readFromServer } from '@ValenceClient/query/readFromServer';
import { AskableElsewhereSchema } from '@ValenceContracts/schemas/LinkSharing';
import type { Askable } from '@ValenceClient/party/whoCanBeAsked';

/**
 * Reads the people from linked servers who have watched here and can be asked along to a party,
 * each by an id to ask them by, their name with their server, and, from a server that says, their
 * own name and which server they are from.
 *
 * @returns The people.
 */
const fetchAskableElsewhere = async (): Promise<Askable[]> =>
  (await readFromServer('/api/linked-servers/people', AskableElsewhereSchema)).people;

export { fetchAskableElsewhere };
