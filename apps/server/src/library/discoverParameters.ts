import type { CatalogueFilters, CatalogueList } from '@ValenceContracts/schemas/CatalogueTitle';

const LEAST_VOTES_TO_TRUST = 100;

/**
 * The parameters that make the catalogue's discover endpoint answer a narrowed list: most popular
 * first, or soonest first for what is coming, held to a genre, to a span of years and to a least
 * rating.
 *
 * A rating means little from a handful of votes, so a least rating also asks for a least number of
 * them, which keeps a title with one ten out of the top of the eights. What is coming starts from
 * today, unless a span of years has been asked for, which then says where it starts.
 *
 * @param list - Which list is being narrowed, which decides how the answer is ordered.
 * @param kind - Whether it is films or series.
 * @param filters - What to narrow it by.
 * @param today - Today, as a date, for the start of what is coming.
 * @returns The parameters to ask with.
 */
const discoverParameters = (
  list: CatalogueList,
  kind: 'tv' | 'movie',
  filters: CatalogueFilters,
  today: string,
): Record<string, string> => {
  const dated = kind === 'movie' ? 'primary_release_date' : 'first_air_date';

  return {
    sort_by: list === 'upcoming' ? `${dated}.asc` : 'popularity.desc',
    ...(list === 'upcoming' ? { [`${dated}.gte`]: today } : {}),
    ...(filters.genre === undefined ? {} : { with_genres: filters.genre }),
    ...(filters.yearFrom === undefined
      ? {}
      : { [`${dated}.gte`]: `${filters.yearFrom.toString()}-01-01` }),
    ...(filters.yearTo === undefined
      ? {}
      : { [`${dated}.lte`]: `${filters.yearTo.toString()}-12-31` }),
    ...(filters.minRating === undefined
      ? {}
      : {
          'vote_average.gte': filters.minRating.toString(),
          'vote_count.gte': LEAST_VOTES_TO_TRUST.toString(),
        }),
  };
};

export { discoverParameters };
