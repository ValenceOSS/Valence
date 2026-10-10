import type { Place } from '@ValenceClient/navigation/readLocation';

/**
 * Every filter the address chose for the search page, read from its list of them, and from the
 * single genre a link from elsewhere — a genre on the home page — still carries.
 *
 * @param place - Where the application is.
 * @returns The filters chosen, such as `genre:Drama` or `decade:1990`.
 */
const filtersOf = (place: Pick<Place, 'genre' | 'filters'>): ReadonlySet<string> =>
  new Set([
    ...(place.filters ?? '').split(',').filter((id) => id.includes(':')),
    ...(place.genre === null ? [] : [`genre:${place.genre}`]),
  ]);

export { filtersOf };
