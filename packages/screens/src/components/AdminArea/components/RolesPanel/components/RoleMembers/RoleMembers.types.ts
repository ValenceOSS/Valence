import type { Account } from '@ValenceClient/admin/fetchAccounts';

type RoleMembersProps = {
  accounts: Account[];
  heldIds: ReadonlySet<string>;
  onToggle: (accountId: string) => void;
};

export type { RoleMembersProps };
