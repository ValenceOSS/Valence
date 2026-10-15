import { z } from 'zod';
import { readFromServer } from '@ValenceClient/query/readFromServer';
import { StreamLimitSchema } from '@ValenceContracts/schemas/StreamLimit';

const AccountStreamLimitSchema = z.object({
  own: StreamLimitSchema,
  effective: StreamLimitSchema,
  streamsNow: z.number().int().nonnegative(),
});

type AccountStreamLimit = z.infer<typeof AccountStreamLimitSchema>;

/**
 * Reads how much an account may stream: the limit set for it, the one it streams under once its
 * roles are counted, and how many streams it has running now.
 *
 * @param userId - The account.
 * @returns Its limits and its streams now.
 */
const accountStreamLimit = (userId: string): Promise<AccountStreamLimit> =>
  readFromServer(
    `/api/admin/accounts/${encodeURIComponent(userId)}/stream-limit`,
    AccountStreamLimitSchema,
  );

export type { AccountStreamLimit };

export { accountStreamLimit, AccountStreamLimitSchema };
