import { readFromServer } from '@ValenceClient/query/readFromServer';
import { LinkingSchema } from '@ValenceContracts/schemas/LinkedServer';
import type { Linking } from '@ValenceContracts/schemas/LinkedServer';

/**
 * Reads this server's identity, its open invites and the servers it is linked with.
 *
 * @returns Everything about linking.
 */
const fetchLinking = (): Promise<Linking> => readFromServer('/api/linked-servers', LinkingSchema);

export { fetchLinking };
