import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { collectionArtworkUrl } from '@ValenceClient/collections/fetchCollections';
import type { Collection } from '@ValenceContracts/schemas/Collection';

/**
 * The one picture that stands for a collection where there is room for only one: the artwork it
 * was given, or else the poster of the first thing in it that has one.
 *
 * @param collection - The collection.
 * @returns Where the picture is on the server, or nothing where it has none.
 */
const collectionCoverPath = (
  collection: Pick<Collection, 'id' | 'hasOwnArtwork' | 'updatedAt' | 'coverMediaIds'>,
): string | null => {
  const [first] = collection.coverMediaIds;

  return (
    collectionArtworkUrl(collection) ?? (first === undefined ? null : artworkUrl(first, 'poster'))
  );
};

export { collectionCoverPath };
