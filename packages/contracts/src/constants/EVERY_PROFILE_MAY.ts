import type { GrantedPermission } from '@ValenceContracts/schemas/Permission';

const EVERY_PROFILE_MAY: ReadonlySet<GrantedPermission> = new Set<GrantedPermission>([
  'sharing.link',
  'sharing.party',
  'download.media',
  'requests.ask',
  'requests.askMusic',
  'requests.viewAll',
  'sources.play',
]);

export { EVERY_PROFILE_MAY };
