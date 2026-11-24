type PlacedRole = {
  id: string;
  position: number;
};

type PlaceRolesOptions = {
  roles: readonly PlacedRole[];
  ids: readonly string[];
  isOwner: boolean;
  actorHighestPosition: number | null;
};

type PlaceRolesRefusal = 'stale' | 'outranked';

/**
 * Works out the rank each role takes from a new order, highest first, refusing an order that is not
 * every role exactly once or that moves anything at or above the actor's own highest role.
 *
 * @param options - Every role as it stands, highest first; the order asked for; and who is asking.
 * @returns Each role's new rank, or why the order is refused.
 */
const placeRoles = ({
  roles,
  ids,
  isOwner,
  actorHighestPosition,
}: PlaceRolesOptions): ReadonlyMap<string, number> | PlaceRolesRefusal => {
  const known = new Set(roles.map((role) => role.id));

  if (
    ids.length !== roles.length ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !known.has(id))
  ) {
    return 'stale';
  }

  const isFixed = (role: PlacedRole) =>
    !isOwner && (actorHighestPosition === null || role.position >= actorHighestPosition);
  const fixed = roles.filter(isFixed);

  if (fixed.some((role, at) => roles[at]?.id !== role.id || ids[at] !== role.id)) {
    return 'outranked';
  }

  const moving = ids.slice(fixed.length);
  const lowestFixed = Math.min(...fixed.map((role) => role.position));
  const lift = fixed.length === 0 ? 0 : Math.max(0, moving.length - lowestFixed);
  const placed = new Map<string, number>();

  for (const role of fixed) {
    placed.set(role.id, role.position + lift);
  }

  moving.forEach((id, at) => {
    placed.set(id, moving.length - 1 - at);
  });

  return placed;
};

export { placeRoles };
export type { PlaceRolesRefusal };
