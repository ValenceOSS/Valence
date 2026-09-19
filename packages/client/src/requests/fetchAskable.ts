import { z } from 'zod';
import { readFromServer } from '@ValenceClient/query/readFromServer';
import {
  CatalogueShelfSchema,
  CatalogueTitleDetailSchema,
  CatalogueTitleSchema,
  RequestProgressSchema,
} from '@ValenceContracts/schemas/CatalogueTitle';
import type {
  CatalogueShelf,
  CatalogueTitle,
  CatalogueTitleDetail,
  RequestProgress,
} from '@ValenceContracts/schemas/CatalogueTitle';
import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Reads the shelves of things to ask for: what is trending, popular and coming, each saying
 * whether it is here already, asked for, or there to be asked for.
 *
 * @returns The shelves.
 */
const fetchDiscover = (): Promise<CatalogueShelf[]> =>
  readFromServer('/api/requests/discover', z.array(CatalogueShelfSchema));

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

export { fetchAskable, fetchDiscover, fetchRequestProgress, searchAskable };
