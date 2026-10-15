/**
 * Where an account's profiles are managed: the signed-in account's own, or, for an administrator,
 * any account's.
 *
 * @param accountId - Whose account, where an administrator is managing somebody else's.
 * @returns The address.
 */
const profilesAddress = (accountId?: string): string =>
  accountId === undefined
    ? '/api/profiles'
    : `/api/admin/accounts/${encodeURIComponent(accountId)}/profiles`;

export { profilesAddress };
