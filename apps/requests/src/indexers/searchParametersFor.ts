import type {
  IndexerCapabilities,
  IndexerSearchMode,
  ReleaseSearch,
} from '@ValenceContracts/schemas/Indexer';

const FUNCTIONS: Record<IndexerSearchMode, string> = {
  search: 'search',
  movie: 'movie',
  tv: 'tvsearch',
  music: 'music',
  book: 'book',
};

/**
 * What to ask one indexer for a search: the kind of search it takes that fits best, with only the
 * parameters it said it understands.
 *
 * An indexer that never said what it can do is asked a plain search with everything a plain search
 * takes. One that cannot do the kind asked for is asked a plain search too, with the words — which is
 * what a person would have typed into it anyway.
 *
 * @param search - What is being looked for.
 * @param capabilities - What the indexer said it can do, where it has said.
 * @param categories - The indexer's own categories, used where the search names none.
 * @returns The query parameters, apart from the key.
 */
const searchParametersFor = (
  search: ReleaseSearch,
  capabilities: IndexerCapabilities | null,
  categories: readonly number[],
): Record<string, string> => {
  const mode = search.mode ?? 'search';
  const supported = capabilities?.modes.find((one) => one.mode === mode) ?? null;
  const isFitting = mode === 'search' || capabilities === null || supported !== null;
  const takes = (parameter: string) =>
    isFitting &&
    (supported === null ? capabilities === null : supported.parameters.includes(parameter));

  const wanted: Record<string, string | undefined> = {
    t: isFitting ? FUNCTIONS[mode] : 'search',
    q: search.query === undefined || search.query === '' ? undefined : search.query,
    imdbid: takes('imdbid') ? search.imdbId?.replace(/^tt/, '') : undefined,
    tmdbid: takes('tmdbid') ? search.tmdbId?.toString() : undefined,
    tvdbid: takes('tvdbid') ? search.tvdbId?.toString() : undefined,
    season: takes('season') ? search.season?.toString() : undefined,
    ep: takes('ep') ? search.episode?.toString() : undefined,
    artist: takes('artist') ? search.artist : undefined,
    album: takes('album') ? search.album : undefined,
    cat: [...(search.categories ?? categories)].join(',') || undefined,
    limit: capabilities?.limit?.toString(),
  };

  return Object.fromEntries(
    Object.entries(wanted).flatMap(([name, value]) => (value === undefined ? [] : [[name, value]])),
  );
};

export { searchParametersFor };
