type Face = { id: string; createdAt: Date };

/**
 * Whether one profile stands for its account ahead of another, which is the older of the two, with
 * the identifier deciding between two made in the same instant.
 *
 * @param one - The profile being considered.
 * @param other - The profile already held.
 * @returns Whether the first should stand for the account.
 */
const comesFirst = (one: Face | null, other: Face | null): boolean => {
  if (one === null) {
    return false;
  }

  if (other === null) {
    return true;
  }

  const mine = one.createdAt.getTime();
  const theirs = other.createdAt.getTime();

  return mine === theirs ? one.id < other.id : mine < theirs;
};

/**
 * Narrows every account joined to every profile it holds down to the one profile each account is
 * drawn with, which is the oldest it holds — the same profile everything else means by the one on
 * this account.
 *
 * Chosen here rather than taken from the order the rows arrive in, because Postgres rewrites a row
 * when it is updated: an account with more than one profile would otherwise swap which of them
 * stood for it the moment somebody uploaded a picture, and the new picture would leave the wall of
 * faces as it was saved.
 *
 * @param rows - Every account paired with each profile it holds, an account with none carrying null.
 * @returns One row per account, in the order the accounts were first seen.
 */
const pickOneFaceEach = <Row extends { userId: string; profile: Face | null }>(
  rows: readonly Row[],
): Row[] => {
  const chosen = new Map<string, Row>();

  for (const row of rows) {
    const held = chosen.get(row.userId);

    if (held === undefined || comesFirst(row.profile, held.profile)) {
      chosen.set(row.userId, row);
    }
  }

  return [...chosen.values()];
};

export { pickOneFaceEach };
