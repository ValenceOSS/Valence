import type { Household } from '@ValenceContracts/schemas/Household';

type AccountPictureDialogProps = {
  isOpen: boolean;
  seed: string;
  household: Household;
  onClose: () => void;
  onSaved: () => void;
};

export type { AccountPictureDialogProps };
