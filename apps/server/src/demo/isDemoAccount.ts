/**
 * Whether an account is one of the shared demo accounts named in DEMO_ACCOUNTS, which everybody
 * visiting a public demo signs in to at once.
 *
 * @param account - The account, as its session holds it.
 * @param demoAccounts - The usernames named as demo accounts, in lower case.
 * @returns Whether it is one of them.
 */
const isDemoAccount = (
  account: { username?: string | null | undefined },
  demoAccounts: readonly string[],
): boolean =>
  typeof account.username === 'string' && demoAccounts.includes(account.username.toLowerCase());

export { isDemoAccount };
