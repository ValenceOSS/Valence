import type { Collection, CollectionSubject } from '@ValenceContracts/schemas/Collection';

type CollectionEditDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  collection?: Collection;
  startsWith?: readonly CollectionSubject[];
  onSaved?: (collectionId: string) => void;
};

export type { CollectionEditDialogProps };
