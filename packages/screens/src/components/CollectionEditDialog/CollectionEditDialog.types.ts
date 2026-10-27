import type { Collection, CollectionSubject } from '@ValenceContracts/schemas/Collection';
import type { TitleRules } from '@ValenceContracts/schemas/SmartRules';

type CollectionEditDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  collection?: Collection;
  startsWith?: readonly CollectionSubject[];
  onSaved?: (collectionId: string) => void;
  isSmart?: boolean;
  letsChooseSmart?: boolean;
  startsWithRules?: TitleRules;
};

export type { CollectionEditDialogProps };
