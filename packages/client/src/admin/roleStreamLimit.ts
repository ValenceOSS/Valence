import { readFromServer } from '@ValenceClient/query/readFromServer';
import { StreamLimitSchema } from '@ValenceContracts/schemas/StreamLimit';
import type { StreamLimit } from '@ValenceContracts/schemas/StreamLimit';

/**
 * Reads the limit everybody holding a role streams under.
 *
 * @param roleId - The role.
 * @returns Its limit.
 */
const roleStreamLimit = (roleId: string): Promise<StreamLimit> =>
  readFromServer(`/api/admin/roles/${encodeURIComponent(roleId)}/stream-limit`, StreamLimitSchema);

export { roleStreamLimit };
