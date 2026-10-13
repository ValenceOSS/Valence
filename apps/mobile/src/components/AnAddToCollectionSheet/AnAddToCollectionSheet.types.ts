import type { CollectionSubject } from '@ValenceContracts/schemas/Collection';

type AnAddToCollectionSheetProps = {
  subject: CollectionSubject | null;
  title: string;
  onClose: () => void;
};

export type { AnAddToCollectionSheetProps };
