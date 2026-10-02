import type { AddedAccount } from '@ValenceClient/admin/fetchAccounts';

type AddAccountDialogProps = {
  isOpen: boolean;
  canEmailSetupLinks: boolean;
  onClose: () => void;
  onAdded: (added: AddedAccount) => void;
  onEdit: (userId: string) => void;
};

export type { AddAccountDialogProps };
