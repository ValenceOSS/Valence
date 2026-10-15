import { StreamLimitSchema } from '@ValenceContracts/schemas/StreamLimit';
import type { StreamLimit } from '@ValenceContracts/schemas/StreamLimit';

/**
 * Sets the limit everybody holding a role streams under.
 *
 * @param roleId - The role.
 * @param limit - The limit, either side of which may be left open.
 * @returns The limit as it now stands, or null where it could not be saved.
 */
const saveRoleStreamLimit = async (
  roleId: string,
  limit: StreamLimit,
): Promise<StreamLimit | null> => {
  const response = await fetch(`/api/admin/roles/${encodeURIComponent(roleId)}/stream-limit`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(limit),
  }).catch(() => null);

  if (response === null || !response.ok) {
    return null;
  }

  const read = StreamLimitSchema.safeParse(await response.json().catch(() => null));

  return read.success ? read.data : null;
};

export { saveRoleStreamLimit };
