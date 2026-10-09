import type { IndexerCapabilities, ReleaseSearch } from '@ValenceContracts/schemas/Indexer';

/**
 * The catalogue ids an indexer is asked a search by: those the search carries that the indexer
 * said it understands for that kind of search. None for an indexer that never said what it can
 * do, nor for a plain search, which takes words alone.
 *
 * @param search - What is being looked for.
 * @param capabilities - What the indexer said it can do, where it has said.
 * @returns The ids, by the parameter each goes in.
 */
const idsTakenBy = (
  search: ReleaseSearch,
  capabilities: IndexerCapabilities | null,
): Partial<Record<'imdbid' | 'tmdbid' | 'tvdbid', string>> => {
  const mode = search.mode ?? 'search';
  const supported = capabilities?.modes.find((one) => one.mode === mode);

  if (mode === 'search' || supported === undefined) {
    return {};
  }

  const takes = (parameter: string) => supported.parameters.includes(parameter);

  return {
    ...(search.imdbId !== undefined && takes('imdbid')
      ? { imdbid: search.imdbId.replace(/^tt/, '') }
      : {}),
    ...(search.tmdbId !== undefined && takes('tmdbid') ? { tmdbid: search.tmdbId.toString() } : {}),
    ...(search.tvdbId !== undefined && takes('tvdbid') ? { tvdbid: search.tvdbId.toString() } : {}),
  };
};

export { idsTakenBy };
