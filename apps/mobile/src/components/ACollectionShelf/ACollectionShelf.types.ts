import type { Collection } from '@ValenceContracts/schemas/Collection';

type ACollectionShelfProps = {
  collections: readonly Collection[];
  onLookAtCollection: (collectionId: string) => void;
};

export type { ACollectionShelfProps };
