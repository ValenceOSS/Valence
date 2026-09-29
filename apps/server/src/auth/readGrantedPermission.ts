import { GrantedPermissionSchema } from '@ValenceContracts/schemas/Permission';
import type { GrantedPermission } from '@ValenceContracts/schemas/Permission';

/**
 * Reads a permission a role holds as the database stored it: one of Valence's own, or a node a
 * plugin registered, and nothing else.
 *
 * @param name - The permission as stored.
 * @returns The permission, or nothing where it is neither.
 */
const readGrantedPermission = (name: string): GrantedPermission | null => {
  const parsed = GrantedPermissionSchema.safeParse(name);

  return parsed.success ? parsed.data : null;
};

export { readGrantedPermission };
