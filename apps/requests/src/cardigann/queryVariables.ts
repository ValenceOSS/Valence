import type { ReleaseSearch } from '@ValenceContracts/schemas/Indexer';
import type { TemplateValue } from '@ValenceRequests/cardigann/TemplateVariables';

const TYPES = {
  search: 'search',
  movie: 'movie',
  tv: 'tvsearch',
  music: 'music',
  book: 'book',
} as const;

/**
 * Writes a season and episode the way a release names them: S02E03, or S02 for a whole season.
 *
 * @param season - The season.
 * @param episode - The episode.
 * @returns The text, or null where there is no season.
 */
const episodeText = (season: number | undefined, episode: number | undefined): string | null =>
  season === undefined
    ? null
    : `S${season.toString().padStart(2, '0')}${episode === undefined ? '' : `E${episode.toString().padStart(2, '0')}`}`;

/**
 * The `.Query` variables a search gives a definition's templates, and `.Query.Keywords`: what was
 * typed, with the episode after it for a series.
 *
 * Every variable the format names is present, most of them unset, so a template that asks for one
 * this search does not carry reads it as unset rather than failing. The `.Query.Is…` flags are
 * `True` or unset.
 *
 * @param search - What is being looked for.
 * @returns The variables.
 */
const queryVariables = (search: ReleaseSearch): Record<string, TemplateValue> => {
  const mode = search.mode ?? 'search';
  const words = search.query?.trim() ?? '';
  const flag = (isTrue: boolean) => (isTrue ? 'True' : null);
  const episode = episodeText(search.season, search.episode);
  const imdb = search.imdbId?.replace(/^tt/, '') ?? null;
  const isIdSearch =
    episode !== null ||
    imdb !== null ||
    search.tmdbId !== undefined ||
    search.tvdbId !== undefined ||
    search.artist !== undefined ||
    search.album !== undefined;

  return {
    '.Query.Type': TYPES[mode],
    '.Query.Q': words,
    '.Query.Keywords': [words, episode].filter((part) => part !== null && part !== '').join(' '),
    '.Query.Categories': (search.categories ?? []).map(String),
    '.Query.Limit': null,
    '.Query.Offset': null,
    '.Query.Extended': null,
    '.Query.APIKey': null,
    '.Query.Genre': null,
    '.Query.Year': null,
    '.Query.Movie': null,
    '.Query.Series': null,
    '.Query.IMDBID': imdb === null ? null : `tt${imdb.padStart(7, '0')}`,
    '.Query.IMDBIDShort': imdb,
    '.Query.TMDBID': search.tmdbId?.toString() ?? null,
    '.Query.TVDBID': search.tvdbId?.toString() ?? null,
    '.Query.TVRageID': null,
    '.Query.TVMazeID': null,
    '.Query.TraktID': null,
    '.Query.DoubanID': null,
    '.Query.Season': search.season?.toString() ?? null,
    '.Query.Ep': search.episode?.toString() ?? null,
    '.Query.Episode': episode,
    '.Query.Artist': search.artist ?? null,
    '.Query.Album': search.album ?? null,
    '.Query.Label': null,
    '.Query.Track': null,
    '.Query.Author': null,
    '.Query.Title': null,
    '.Query.Publisher': null,
    '.Query.IsSearch': flag(mode === 'search'),
    '.Query.IsMovieSearch': flag(mode === 'movie'),
    '.Query.IsTVSearch': flag(mode === 'tv'),
    '.Query.IsMusicSearch': flag(mode === 'music'),
    '.Query.IsBookSearch': flag(mode === 'book'),
    '.Query.IsImdbQuery': flag(imdb !== null),
    '.Query.IsTmdbQuery': flag(search.tmdbId !== undefined),
    '.Query.IsTvdbQuery': flag(search.tvdbId !== undefined),
    '.Query.IsTVRageQuery': null,
    '.Query.IsTvmazeQuery': null,
    '.Query.IsTraktQuery': null,
    '.Query.IsDoubanQuery': null,
    '.Query.IsGenreQuery': null,
    '.Query.IsIdSearch': flag(isIdSearch),
    '.Query.IsRssSearch': flag(words === '' && !isIdSearch),
  };
};

export { queryVariables };
