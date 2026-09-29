import type { GrantedPermission, Permission } from '@ValenceContracts/schemas/Permission';
import type { PluginContributions } from '@ValenceContracts/schemas/Plugin';

type PermissionEditorProps = {
  catalogue: Permission[];
  pluginNodes?: PluginContributions['nodes'];
  selected: readonly GrantedPermission[];
  onToggle: (permission: GrantedPermission) => void;
};

export type { PermissionEditorProps };
