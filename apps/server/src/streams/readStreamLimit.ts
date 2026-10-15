import { strictestStreamLimit } from '@ValenceContracts/functions/strictestStreamLimit';
import { NO_STREAM_LIMIT } from '@ValenceContracts/schemas/StreamLimit';
import type { StreamLimit, StreamLimits } from '@ValenceContracts/schemas/StreamLimit';

/**
 * Works out the limit an account streams under: its own and that of every role it holds, the
 * strictest of each.
 *
 * @param limits - The limits set for accounts and roles.
 * @param accountId - The account.
 * @param roleIds - The roles it holds.
 * @returns The limit it streams under.
 */
const readStreamLimit = (
  limits: StreamLimits | undefined,
  accountId: string,
  roleIds: readonly string[],
): StreamLimit =>
  strictestStreamLimit([
    limits?.accounts[accountId] ?? NO_STREAM_LIMIT,
    ...roleIds.map((roleId) => limits?.roles[roleId] ?? NO_STREAM_LIMIT),
  ]);

export { readStreamLimit };
