import type { Account } from '@ValenceClient/admin/fetchAccounts';
import type { Role } from '@ValenceContracts/schemas/Permission';

type MemberRowProps = {
  account: Account;
  isHeld: boolean;
  heldRoles: readonly Role[];
  isLocked: boolean;
  onToggle: () => void;
};

export type { MemberRowProps };
