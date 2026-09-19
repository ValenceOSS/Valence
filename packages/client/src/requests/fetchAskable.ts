import { z } from 'zod';
import { readFromServer } from '@ValenceClient/query/readFromServer';
import {
  CatalogueDiscoverySchema,
  CataloguePageSchema,
  CatalogueTitleDetailSchema,
  CatalogueTitleSchema,
  RequestProgressSchema,
} from '@ValenceContracts/schemas/CatalogueTitle';
import type {
  CatalogueBrowse,
  CatalogueDiscovery,
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
 * @returns The page, each title saying where it stands, and whether there is more after it.
 */
const fetchCatalogueBrowse = (browsing: CatalogueBrowse, page: number): Promise<CataloguePage> =>
  readFromServer(
    `/api/requests/catalogue/browse?${new URLSearchParams({
      kind: browsing.kind,
      list: browsing.list,
      ...(browsing.studio === null ? {} : { studio: browsing.studio }),
      page: page.toString(),
    }).toString()}`,
    CataloguePageSchema,
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

export { fetchAskable, fetchCatalogueBrowse, fetchDiscover, fetchRequestProgress, searchAskable };
