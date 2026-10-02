import type { PasswordResetAsk } from '@ValenceContracts/schemas/PasswordResetRequest';

const QUIET_MS = 60_000;

type ResetAccount = { userId: string; email: string };

type CreatePasswordResetRequestsOptions = {
  findAccount: (ask: PasswordResetAsk) => Promise<ResetAccount | null>;
  request: (email: string, redirectTo: string) => Promise<void>;
  now?: () => number;
};

/**
 * Takes somebody's word for which account they forgot the password to, by its username, its
 * address or the face they picked, and asks for a reset link for it — at most once a minute per
 * account, so the form cannot be used to fill somebody's inbox. Nothing about whether the account
 * exists is answered.
 *
 * @param options - How an account is found, how a reset is asked for, and the clock.
 * @returns A function that asks for a reset, given who they say they are and where the link
 *   should lead.
 */
const createPasswordResetRequests = ({
  findAccount,
  request,
  now = () => Date.now(),
}: CreatePasswordResetRequestsOptions): ((
  ask: PasswordResetAsk,
  redirectTo: string,
) => Promise<void>) => {
  const lastAsked = new Map<string, number>();

  return async (ask, redirectTo) => {
    const account = await findAccount(ask);

    if (account === null) {
      return;
    }

    const at = now();
    const before = lastAsked.get(account.userId);

    if (before !== undefined && at - before < QUIET_MS) {
      return;
    }

    lastAsked.set(account.userId, at);
    await request(account.email, redirectTo);
  };
};

export type { CreatePasswordResetRequestsOptions, ResetAccount };

export { createPasswordResetRequests };
