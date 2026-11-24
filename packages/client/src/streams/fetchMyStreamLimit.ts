import { readFromServer } from '@ValenceClient/query/readFromServer';
import { StreamLimitSchema } from '@ValenceContracts/schemas/StreamLimit';
import type { StreamLimit } from '@ValenceContracts/schemas/StreamLimit';

/**
 * Reads the limit the account signed in streams under, its own and its roles' together.
 *
 * @returns The limit.
 */
const fetchMyStreamLimit = (): Promise<StreamLimit> =>
  readFromServer('/api/account/stream-limit', StreamLimitSchema);

export { fetchMyStreamLimit };
