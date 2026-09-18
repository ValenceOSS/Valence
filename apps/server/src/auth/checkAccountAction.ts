type AccountActionRefusal = 'outranked' | 'self' | 'owner';

type CheckAccountActionOptions = {
  actorId: string;
  actorHighestPosition: number | null;
  targetId: string;
  targetHighestPosition: number | null;
  ownerId: string | null;
};

/**
 * Decides whether one account may ban or remove another, and says why not when it may not.
 *
 * Rank decides it: nobody may act on somebody at or above their own highest role. That includes
 * another administrator, which is the point — an administrator used to be exempt from this
 * altogether, so anybody given the role could ban the person who gave it to them, reset their
 * password and end their sessions. Handing somebody help with the server meant handing them the
 * ability to take it.
 *
 * The owner sits outside the rule in both directions: nobody may act on them, and they may act on
 * anybody. Somebody has to be able to remove an administrator who has gone wrong, and with equal
 * rank refused for everybody else it could otherwise be nobody.
 *
 * Acting on yourself is refused before any of it, which is what stops somebody removing their own
 * last way in.
 *
 * @param options - Who is acting, how senior they are, who they are acting on, and who owns this
 *   server.
 * @returns Why the action is refused, or null where it is allowed.
 */
const checkAccountAction = ({
  actorId,
  actorHighestPosition,
  targetId,
  targetHighestPosition,
  ownerId,
}: CheckAccountActionOptions): AccountActionRefusal | null => {
  if (actorId === targetId) {
    return 'self';
  }

  if (ownerId !== null && targetId === ownerId) {
    return 'owner';
  }

  if (ownerId !== null && actorId === ownerId) {
    return null;
  }

  if (actorHighestPosition === null) {
    return 'outranked';
  }

  if (targetHighestPosition === null) {
    return null;
  }

  return targetHighestPosition >= actorHighestPosition ? 'outranked' : null;
};

export { checkAccountAction };
export type { AccountActionRefusal };
