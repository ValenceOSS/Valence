import { queryOptions } from '@tanstack/react-query';
import { fetchCollection, fetchCollections } from '@ValenceClient/collections/fetchCollections';
import type { CollectionSubject } from '@ValenceContracts/schemas/Collection';

const COLLECTIONS = ['collections'] as const;

/**
 * The collections holding something this profile may see, with the empty ones too where asked for
 * by somebody who looks after them.
 *
 * @param withEmpty - Whether to read the collections holding nothing this profile may see.
 * @returns The query.
 */
const all = (withEmpty = false) =>
  queryOptions({
    queryKey: [...COLLECTIONS, 'all', withEmpty ? 'withEmpty' : 'filled'],
    queryFn: () => fetchCollections({ withEmpty }),
  });

/**
 * The collections one film or programme is part of.
 *
 * @param subject - The film or programme.
 * @returns The query.
 */
const containing = (subject: CollectionSubject) =>
  queryOptions({
    queryKey: [
      ...COLLECTIONS,
      'containing',
      'mediaItemId' in subject ? subject.mediaItemId : subject.seriesId,
    ],
    queryFn: () => fetchCollections({ containing: subject }),
  });

/**
 * One collection and its entries.
 *
 * @param collectionId - The collection.
 * @returns The query.
 */
const one = (collectionId: string) =>
  queryOptions({
    queryKey: [...COLLECTIONS, 'one', collectionId],
    queryFn: () => fetchCollection(collectionId),
  });

const collectionQueries = { all, containing, key: COLLECTIONS, one };

export { collectionQueries };
