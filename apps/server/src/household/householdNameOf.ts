/**
 * What a household is called: the name it chose for itself, or its account's name until it has.
 *
 * @param account - The account's name, and the household's own name where it has one.
 * @param account.name - The account's name.
 * @param account.household - The household's own name, if any.
 * @returns The name to show.
 */
const householdNameOf = (account: { name: string; household: string | null }): string => {
  const chosen = account.household?.trim() ?? '';

  return chosen === '' ? account.name : chosen;
};

export { householdNameOf };
