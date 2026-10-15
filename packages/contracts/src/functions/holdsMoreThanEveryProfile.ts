import { EVERY_PROFILE_MAY } from '@ValenceContracts/constants/EVERY_PROFILE_MAY';
import type { GrantedPermission } from '@ValenceContracts/schemas/Permission';

/**
 * Whether an account may do more than every profile on it may anyway — run the server, approve
 * requests, manage people — which is what makes its owner profile worth a PIN once others share it.
 *
 * @param held - What the account may do.
 * @returns Whether it holds anything beyond the everyday.
 */
const holdsMoreThanEveryProfile = (held: ReadonlySet<GrantedPermission>): boolean =>
  [...held].some((permission) => !EVERY_PROFILE_MAY.has(permission));

export { holdsMoreThanEveryProfile };
