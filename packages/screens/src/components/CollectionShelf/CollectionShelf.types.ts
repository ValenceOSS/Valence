import type { CollectionEntryKind } from '@ValenceContracts/schemas/Collection';

type CollectionShelfProps = {
  holds: CollectionEntryKind;
  onOpen: (collectionId: string) => void;
  className?: string;
};

export type { CollectionShelfProps };
