import { GrantedPermissionOrRetiredSchema } from '@ValenceContracts/schemas/Permission';
import type { GrantedPermission } from '@ValenceContracts/schemas/Permission';

/**
 * Reads a permission a role holds as the database stored it: one of Valence's own, or a node a
 * plugin registered, and nothing else; one since folded into another reads as the one it became.
 *
 * @param name - The permission as stored.
 * @returns The permission, or nothing where it is neither.
 */
const readGrantedPermission = (name: string): GrantedPermission | null => {
  const parsed = GrantedPermissionOrRetiredSchema.safeParse(name);

  return parsed.success ? parsed.data : null;
};

export { readGrantedPermission };
