import {
  RETIRED_PERMISSIONS,
  RETIRED_PERMISSION_NAMES,
} from '@ValenceContracts/schemas/Permission';
import type { Permission } from '@ValenceContracts/schemas/Permission';

/**
 * The permission a retired one was folded into, including those whose grants are not carried over
 * because the permission they became does more.
 *
 * @param name - The name as stored.
 * @returns The permission it became, or null where it is not a retired name.
 */
const retiredSuccessorOf = (name: string): Permission | null => {
  const retired = RETIRED_PERMISSION_NAMES.find((one) => one === name);

  return retired === undefined ? null : RETIRED_PERMISSIONS[retired];
};

export { retiredSuccessorOf };
