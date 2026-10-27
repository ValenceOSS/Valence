import type { CollectionEntryKind } from '@ValenceContracts/schemas/Collection';

type NewCollectionButtonProps = {
  holds: CollectionEntryKind;
  onMade: (collectionId: string) => void;
};

export type { NewCollectionButtonProps };
