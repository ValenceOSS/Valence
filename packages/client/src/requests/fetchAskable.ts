import { z } from 'zod';
import { readFromServer } from '@ValenceClient/query/readFromServer';
import {
  CatalogueDiscoverySchema,
  CatalogueGenreSchema,
  CataloguePageSchema,
  CatalogueTitleDetailSchema,
  CatalogueTitleSchema,
  RequestProgressSchema,
} from '@ValenceContracts/schemas/CatalogueTitle';
import type {
  CatalogueBrowse,
  CatalogueDiscovery,
  CatalogueFilters,
  CatalogueGenre,
  CataloguePage,
  CatalogueTitle,
  CatalogueTitleDetail,
  RequestProgress,
} from '@ValenceContracts/schemas/CatalogueTitle';
import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Reads the shelves of things to ask for: what is trending, popular and coming, each saying
 * whether it is here already, asked for, or there to be asked for, and the studios to browse by.
 *
 * @returns The shelves and the studios.
 */
const fetchDiscover = (): Promise<CatalogueDiscovery> =>
  readFromServer('/api/requests/discover', CatalogueDiscoverySchema);

/**
 * Reads a page of a whole list of films or series to ask for, rather than the shelf's worth of it.
 *
 * @param browsing - Which list, of which kind, and whose studio where one was chosen.
 * @param page - Which page, counting from one.
 * @param filters - What to narrow it by: a genre, a span of years, a least rating.
 * @returns The page, each title saying where it stands, and whether there is more after it.
 */
const fetchCatalogueBrowse = (
  browsing: CatalogueBrowse,
  page: number,
  filters: CatalogueFilters = {},
): Promise<CataloguePage> =>
  readFromServer(
    `/api/requests/catalogue/browse?${new URLSearchParams({
      kind: browsing.kind,
      list: browsing.list,
      ...(browsing.studio === null ? {} : { studio: browsing.studio }),
      ...(filters.genre === undefined ? {} : { genre: filters.genre }),
      ...(filters.yearFrom === undefined ? {} : { yearFrom: filters.yearFrom.toString() }),
      ...(filters.yearTo === undefined ? {} : { yearTo: filters.yearTo.toString() }),
      ...(filters.minRating === undefined ? {} : { minRating: filters.minRating.toString() }),
      page: page.toString(),
    }).toString()}`,
    CataloguePageSchema,
  );

/**
 * Reads the genres a list of films or series can be narrowed to.
 *
 * @param kind - Whether it is films or series.
 * @returns Each genre, by the id to narrow with and the name to show.
 */
const fetchCatalogueGenres = (kind: CatalogueBrowse['kind']): Promise<CatalogueGenre[]> =>
  readFromServer(
    `/api/requests/catalogue/genres?${new URLSearchParams({ kind }).toString()}`,
    z.array(CatalogueGenreSchema),
  );

/**
 * Searches the catalogue for films, series, artists or albums to ask for.
 *
 * @param query - What was typed.
 * @param kind - Which kind is looked for.
 * @returns What was found, each saying where it stands.
 */
const searchAskable = (query: string, kind: MediaRequestKind): Promise<CatalogueTitle[]> =>
  readFromServer(
    `/api/requests/catalogue/search?${new URLSearchParams({ query, kind }).toString()}`,
    z.array(CatalogueTitleSchema),
  );

/**
 * Reads everything a title's page shows of something that can be asked for.
 *
 * @param kind - What kind of title it is.
 * @param id - The id it was listed under.
 * @returns The title.
 */
const fetchAskable = (kind: MediaRequestKind, id: string): Promise<CatalogueTitleDetail> =>
  readFromServer(
    `/api/requests/catalogue/title/${kind}/${encodeURIComponent(id)}`,
    CatalogueTitleDetailSchema,
  );

/**
 * Reads how the downloads your own requests are waiting on are going.
 *
 * @returns Each of them, how far it has got and how long is left.
 */
const fetchRequestProgress = (): Promise<RequestProgress[]> =>
  readFromServer('/api/requests/progress', z.array(RequestProgressSchema));

export {
  fetchAskable,
  fetchCatalogueBrowse,
  fetchCatalogueGenres,
  fetchDiscover,
  fetchRequestProgress,
  searchAskable,
};
