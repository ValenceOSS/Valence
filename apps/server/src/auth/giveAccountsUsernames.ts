import { deriveUsername } from './deriveUsername';

type UnnamedAccount = {
  id: string;
  name: string;
  email: string;
  username: string | null;
};

type GiveAccountsUsernamesOptions = {
  accounts: () => Promise<UnnamedAccount[]>;
  assign: (accountId: string, username: string) => Promise<void>;
};

/**
 * Gives every account without a username one of its own, in the order the accounts are listed, so
 * accounts made before usernames existed can still sign in by one. Accounts that have one are left
 * alone, so running it again changes nothing.
 *
 * @param options - The accounts, oldest first, and how to record a username against one.
 * @returns How many accounts were given a username.
 */
const giveAccountsUsernames = async ({
  accounts,
  assign,
}: GiveAccountsUsernamesOptions): Promise<number> => {
  const everyone = await accounts();
  const taken = new Set(
    everyone.flatMap((account) =>
      account.username === null ? [] : [account.username.toLowerCase()],
    ),
  );
  let given = 0;

  for (const account of everyone) {
    if (account.username !== null) {
      continue;
    }

    const username = deriveUsername(account, taken);

    taken.add(username);
    await assign(account.id, username);
    given += 1;
  }

  return given;
};

export type { UnnamedAccount };

export { giveAccountsUsernames };
