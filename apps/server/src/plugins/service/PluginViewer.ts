import type { GrantedPermission } from '@ValenceContracts/schemas/Permission';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

type PluginViewer = {
  accountId: string;
  profileId: string;
  isAdmin: boolean;
  grants: ReadonlySet<GrantedPermission>;
  reads: Viewer;
};

export type { PluginViewer };
