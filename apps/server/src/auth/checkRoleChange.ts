import { ADMINISTRATOR } from '@ValenceContracts/schemas/Permission';
import type { GrantedPermission } from '@ValenceContracts/schemas/Permission';

type RoleChangeRefusal = 'outranked' | 'escalation';

type CheckRoleChangeOptions = {
  actorId: string;
  actorHighestPosition: number | null;
  actorPermissions: ReadonlySet<GrantedPermission>;
  targetPosition: number;
  granting?: readonly GrantedPermission[];
  ownerId: string | null;
};

/**
 * Decides whether an account may change a role, and says why not when it may not.
 *
 * Two rules, both about not exceeding your own reach: a role at or above your own highest is out of
 * bounds, and you cannot grant a permission you do not hold. Both bind an administrator too, since
 * one exempt could rewrite the administrator role itself — and so hand themselves whatever the rank
 * rule refuses them.
 *
 * Rank applies to everybody but the owner. Holding `administrator` still means holding every
 * permission for the second rule, because that is what the wildcard means; it does not mean
 * outranking your equals.
 *
 * @param options - Who is acting, how senior they are, what they hold, the role being changed, any
 *   permissions being granted to it, and who owns this server.
 * @returns Why the change is refused, or null where it is allowed.
 */
const checkRoleChange = ({
  actorId,
  actorHighestPosition,
  actorPermissions,
  targetPosition,
  granting = [],
  ownerId,
}: CheckRoleChangeOptions): RoleChangeRefusal | null => {
  if (ownerId !== null && actorId === ownerId) {
    return null;
  }

  if (actorHighestPosition === null || targetPosition >= actorHighestPosition) {
    return 'outranked';
  }

  const holds = (permission: GrantedPermission): boolean =>
    actorPermissions.has(ADMINISTRATOR) || actorPermissions.has(permission);

  return granting.some((permission) => !holds(permission)) ? 'escalation' : null;
};

export { checkRoleChange };
export type { RoleChangeRefusal };
