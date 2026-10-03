import { readFromServer } from '@ValenceClient/query/readFromServer';
import { AskableElsewhereSchema } from '@ValenceContracts/schemas/LinkSharing';

/**
 * Reads the people from linked servers who have watched here and can be asked along to a party,
 * each by an id to ask them by and their name with their server.
 *
 * @returns The people.
 */
const fetchAskableElsewhere = async (): Promise<{ id: string; name: string }[]> =>
  (await readFromServer('/api/linked-servers/people', AskableElsewhereSchema)).people;

export { fetchAskableElsewhere };
