import type { Account } from '@ValenceClient/admin/fetchAccounts';
import type { Permission, Role } from '@ValenceContracts/schemas/Permission';
import type { PluginContributions } from '@ValenceContracts/schemas/Plugin';

type RoleEditorProps = {
  role: Role | null;
  roles: readonly Role[];
  outOfReach: ReadonlySet<string>;
  isOutOfReach: boolean;
  catalogue: Permission[];
  pluginNodes?: PluginContributions['nodes'];
  accounts: Account[] | undefined;
  onChange: (draft: { name: string; isChanged: boolean }) => void;
  onSaved: (roleId: string) => void;
  onCancel: () => void;
};

export type { RoleEditorProps };
