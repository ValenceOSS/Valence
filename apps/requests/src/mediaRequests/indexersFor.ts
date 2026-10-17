import type { IndexerRecord } from '@ValenceRequests/indexers/IndexerRecord';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';

/**
 * Which indexers a request may be searched on: the ones it was given by hand where it has any, and
 * otherwise every indexer that serves its library — one kept for no library in particular serves
 * them all. A search narrowed further by hand keeps only the ones it names of those.
 *
 * @param request - What was asked for.
 * @param indexers - Every indexer there is.
 * @param chosen - The indexers a search by hand was narrowed to, or nothing for all of them.
 * @returns The ids of the indexers to search, or nothing where every indexer may be searched.
 */
const indexersFor = (
  request: Pick<MediaRequestRecord, 'libraryId' | 'indexerIds'>,
  indexers: readonly Pick<IndexerRecord, 'id' | 'libraryIds'>[],
  chosen: readonly string[] | null = null,
): string[] | undefined => {
  const given = request.indexerIds ?? null;
  const allowed =
    given !== null && given.length > 0
      ? indexers.filter((indexer) => given.includes(indexer.id))
      : indexers.filter(
          (indexer) =>
            indexer.libraryIds.length === 0 || indexer.libraryIds.includes(request.libraryId),
        );
  const narrowed =
    chosen === null ? allowed : allowed.filter((indexer) => chosen.includes(indexer.id));

  return narrowed.length === indexers.length ? undefined : narrowed.map((indexer) => indexer.id);
};

export { indexersFor };
