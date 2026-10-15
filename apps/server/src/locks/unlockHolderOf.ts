/**
 * Who an unlocked library is unlocked for: one profile on one account, so a library a parent
 * unlocked on the family's television stays locked for their child's profile on it.
 *
 * @param who - The account, and the profile acting for it.
 * @param who.accountId - The account.
 * @param who.profileId - The profile, where one is acting.
 * @returns What the unlocking is signed for.
 */
const unlockHolderOf = (who: { accountId: string; profileId: string | null }): string =>
  `${who.accountId}/${who.profileId ?? ''}`;

export { unlockHolderOf };
