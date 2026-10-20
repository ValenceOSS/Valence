/**
 * What an account is called: its one profile's name where only one person watches on it, and
 * otherwise the name it chose for itself, or its owner profile's until it has.
 *
 * @param account - The account's own name, what it chose to be called, and its profiles.
 * @param account.name - The account's name, for an account with no profile yet.
 * @param account.household - The name the account chose for itself, if any.
 * @param account.profiles - Its profiles' names, and which is the owner.
 * @returns The name to show.
 */
const householdNameOf = (account: {
  name: string;
  household: string | null;
  profiles: readonly { name: string; isOwner: boolean }[];
}): string => {
  const owner = account.profiles.find((profile) => profile.isOwner) ?? account.profiles[0];
  const followed = owner?.name ?? account.name;

  if (account.profiles.length === 1) {
    return followed;
  }

  const chosen = account.household?.trim() ?? '';

  return chosen === '' ? followed : chosen;
};

export { householdNameOf };
