type Candidate = {
  id: string;
  createdAt: Date;
};

/**
 * Decides who owns a server that was installed before anybody was recorded as owning it.
 *
 * The oldest administrator, because on every install that exists the first account is the one made
 * during setup and promoted there — so the oldest is the person whose server it is, and no later
 * administrator can claim otherwise.
 *
 * Answers nothing where an owner is already recorded, so this settles a server once and never
 * revisits it. Nothing where there is no administrator either: a server nobody administers has
 * nobody to protect, and guessing would hand it to whoever happened to sign up first.
 *
 * @param recorded - The owner already recorded, which is empty on a server that has none.
 * @param administrators - Every account holding the administrator role.
 * @returns The account to record as owner, or null where there is nothing to settle.
 */
const settleTheOwner = (recorded: string, administrators: readonly Candidate[]): string | null => {
  if (recorded !== '') {
    return null;
  }

  const oldest = [...administrators].sort(
    (one, other) => one.createdAt.getTime() - other.createdAt.getTime(),
  )[0];

  return oldest?.id ?? null;
};

export type { Candidate };

export { settleTheOwner };
