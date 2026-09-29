import type { GrantedPermission } from '@ValenceContracts/schemas/Permission';

type PluginViewer = {
  accountId: string;
  profileId: string;
  isAdmin: boolean;
  grants: ReadonlySet<GrantedPermission>;
};

export type { PluginViewer };
