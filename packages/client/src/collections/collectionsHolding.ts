import type { Collection, CollectionEntryKind } from '@ValenceContracts/schemas/Collection';

/**
 * The collections for a page of films, or of programmes: those holding that kind of title.
 *
 * @param collections - Every collection.
 * @param kind - Films or programmes.
 * @returns The collections holding it.
 */
const collectionsHolding = (
  collections: readonly Collection[],
  kind: CollectionEntryKind,
): Collection[] => collections.filter((collection) => collection.holds.includes(kind));

export { collectionsHolding };
