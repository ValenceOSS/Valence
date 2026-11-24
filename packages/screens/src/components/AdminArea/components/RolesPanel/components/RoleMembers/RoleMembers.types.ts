import type { Account } from '@ValenceClient/admin/fetchAccounts';
import type { Role } from '@ValenceContracts/schemas/Permission';

type RoleMembersProps = {
  accounts: Account[];
  heldIds: ReadonlySet<string>;
  onToggle: (accountId: string) => void;
  roles?: readonly Role[];
  roleId?: string | null;
  outOfReach?: ReadonlySet<string>;
};

export type { RoleMembersProps };
