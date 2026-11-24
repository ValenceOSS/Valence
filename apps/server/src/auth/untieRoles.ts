import type { PermissionService } from './PermissionService';

/**
 * Gives every role a rank of its own where any two share one, keeping the order they are listed in,
 * so which role ranks highest never depends on the order the database happens to return them in.
 *
 * @param permissions - The permission service holding the roles.
 * @returns Whether any role was moved.
 */
const untieRoles = async (permissions: PermissionService): Promise<boolean> => {
  const roles = await permissions.listRoles();

  if (new Set(roles.map((role) => role.position)).size === roles.length) {
    return false;
  }

  await permissions.rankRoles(new Map(roles.map((role, at) => [role.id, roles.length - 1 - at])));

  return true;
};

export { untieRoles };
