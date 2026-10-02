import type { Collection } from '@ValenceContracts/schemas/Collection';

type CollectionCoverProps = {
  collection: Pick<Collection, 'id' | 'name' | 'hasOwnArtwork' | 'coverMediaIds' | 'updatedAt'>;
  iconSize?: number;
  className?: string;
};

export type { CollectionCoverProps };
