import { AccountStreamLimitSchema } from '@ValenceClient/admin/accountStreamLimit';
import type { AccountStreamLimit } from '@ValenceClient/admin/accountStreamLimit';
import type { StreamLimit } from '@ValenceContracts/schemas/StreamLimit';

/**
 * Sets the highest bitrate an account may stream at and how many streams it may have at once.
 *
 * @param userId - The account.
 * @param limit - The limit, either side of which may be left open.
 * @returns The limits as they now stand, or null where they could not be saved.
 */
const saveAccountStreamLimit = async (
  userId: string,
  limit: StreamLimit,
): Promise<AccountStreamLimit | null> => {
  const response = await fetch(`/api/admin/accounts/${encodeURIComponent(userId)}/stream-limit`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(limit),
  }).catch(() => null);

  if (response === null || !response.ok) {
    return null;
  }

  const read = AccountStreamLimitSchema.safeParse(await response.json().catch(() => null));

  return read.success ? read.data : null;
};

export { saveAccountStreamLimit };
