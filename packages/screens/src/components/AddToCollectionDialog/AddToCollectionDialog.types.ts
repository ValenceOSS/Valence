import type { CollectionSubject } from '@ValenceContracts/schemas/Collection';

type AddToCollectionDialogProps = {
  subject: CollectionSubject | readonly CollectionSubject[] | null;
  title: string;
  onClose: () => void;
};

export type { AddToCollectionDialogProps };
