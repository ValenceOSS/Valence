import { readFromServer } from '@ValenceClient/query/readFromServer';
import { UpdateCheckSchema } from '@ValenceContracts/schemas/UpdateCheck';
import type { UpdateCheck } from '@ValenceContracts/schemas/UpdateCheck';

/**
 * Reads whether a newer release of Valence is out.
 *
 * @param isForced - Whether to ask GitHub again now, rather than take what the server last heard.
 * @returns This release, the newest, and what changed.
 */
const fetchUpdateCheck = (isForced = false): Promise<UpdateCheck> =>
  readFromServer(
    isForced ? '/api/admin/updates?now=true' : '/api/admin/updates',
    UpdateCheckSchema,
  );

export { fetchUpdateCheck };
