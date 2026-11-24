import { strictestStreamLimit } from '@ValenceContracts/functions/strictestStreamLimit';
import { NO_STREAM_LIMIT } from '@ValenceContracts/schemas/StreamLimit';
import type { StreamLimit, StreamLimits } from '@ValenceContracts/schemas/StreamLimit';

/**
 * Works out the limit an account streams under: that of its highest-ranked role, as the role that
 * decides what it may do elsewhere, made stricter on any side by the account's own.
 *
 * @param limits - The limits set for accounts and roles.
 * @param accountId - The account.
 * @param roles - The roles it holds, each with where it ranks.
 * @returns The limit it streams under.
 */
const readStreamLimit = (
  limits: StreamLimits | undefined,
  accountId: string,
  roles: readonly { id: string; position: number }[],
): StreamLimit => {
  const highest = roles.reduce<{ id: string; position: number } | null>(
    (best, role) => (best === null || role.position > best.position ? role : best),
    null,
  );

  return strictestStreamLimit([
    limits?.accounts[accountId] ?? NO_STREAM_LIMIT,
    highest === null ? NO_STREAM_LIMIT : (limits?.roles[highest.id] ?? NO_STREAM_LIMIT),
  ]);
};

export { readStreamLimit };
