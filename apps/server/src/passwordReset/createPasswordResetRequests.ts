const QUIET_MS = 60_000;

type ResetAccount = { userId: string; email: string };

type CreatePasswordResetRequestsOptions = {
  findAccount: (identifier: string) => Promise<ResetAccount | null>;
  request: (email: string, redirectTo: string) => Promise<void>;
  now?: () => number;
};

/**
 * Takes somebody's word for which account they forgot the password to, by its username or its
 * address, and asks for a reset link for it — at most once a minute per account, so the form cannot
 * be used to fill somebody's inbox. Nothing about whether the account exists is answered.
 *
 * @param options - How an account is found, how a reset is asked for, and the clock.
 * @returns A function that asks for a reset, given what was typed and where the link should lead.
 */
const createPasswordResetRequests = ({
  findAccount,
  request,
  now = () => Date.now(),
}: CreatePasswordResetRequestsOptions): ((
  identifier: string,
  redirectTo: string,
) => Promise<void>) => {
  const lastAsked = new Map<string, number>();

  return async (identifier, redirectTo) => {
    const account = await findAccount(identifier.trim());

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
