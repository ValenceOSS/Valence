import { DEMO_WITHHOLDS } from '@ValenceServer/demo/DEMO_WITHHOLDS';
import type { GrantedPermission } from '@ValenceContracts/schemas/Permission';

/**
 * What a shared demo account holds once what it may never do is taken away, whatever its roles say.
 *
 * @param held - What its roles and overrides grant.
 * @returns The same, less handing out share links.
 */
const withholdFromTheDemo = (
  held: ReadonlySet<GrantedPermission>,
): ReadonlySet<GrantedPermission> =>
  new Set([...held].filter((permission) => !DEMO_WITHHOLDS.some((one) => one === permission)));

export { withholdFromTheDemo };
