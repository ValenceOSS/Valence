import type { Account } from '@ValenceContracts/schemas/Account';

type AccountStandingKind = 'banned' | 'waiting' | 'expired' | 'cannotSignIn' | 'active';

/**
 * Where an account stands, as the accounts list shows it: banned, waiting for its owner to set it
 * up, its setup link run out, unable to sign in with no link at all, or in use.
 *
 * @param account - The account.
 * @returns Its standing.
 */
const accountStandingOf = (account: Account): AccountStandingKind => {
  if (account.isBanned) {
    return 'banned';
  }

  if (account.canSignIn) {
    return 'active';
  }

  if (account.setup.state === 'waiting') {
    return 'waiting';
  }

  return account.setup.state === 'expired' ? 'expired' : 'cannotSignIn';
};

export type { AccountStandingKind };

export { accountStandingOf };
