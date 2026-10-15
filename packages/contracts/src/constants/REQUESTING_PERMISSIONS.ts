import type { GrantedPermission } from '@ValenceContracts/schemas/Permission';

const REQUESTING_PERMISSIONS: ReadonlySet<GrantedPermission> = new Set<GrantedPermission>([
  'requests.ask',
  'requests.askMusic',
]);

export { REQUESTING_PERMISSIONS };
