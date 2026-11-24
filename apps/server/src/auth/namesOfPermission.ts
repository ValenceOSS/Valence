import { RETIRED_PERMISSIONS } from '@ValenceContracts/schemas/Permission';
import type { Permission } from '@ValenceContracts/schemas/Permission';

/**
 * Every name a permission may be stored under: its own, and those of the permissions since folded
 * into it, which rows written by an earlier version of Valence still carry.
 *
 * @param permission - The permission.
 * @returns Its own name first, then any retired ones that became it.
 */
const namesOfPermission = (permission: Permission): string[] => [
  permission,
  ...Object.entries(RETIRED_PERMISSIONS)
    .filter(([, became]) => became === permission)
    .map(([retired]) => retired),
];

export { namesOfPermission };
