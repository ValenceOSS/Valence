import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { CatalogueLookup } from '@ValenceServer/requests/catalogue/CatalogueLookup';
import { heldNowAs } from '@ValenceServer/requests/arrivals/heldNowAs';
import type { Departure } from '@ValenceServer/requests/arrivals/matchDepartures';

type MatchRematchesOptions = {
  requests: readonly MediaRequest[];
  heldAs: ReadonlyMap<string, string | null>;
  lookup: Pick<CatalogueLookup, 'films' | 'series' | 'albums'>;
};

/**
 * Every request answered by a film or series that has just been said to be another title: followed
 * to wherever the library holds the title asked for now, or let go where it holds it nowhere. A
 * file matched to the wrong title would otherwise go on answering a request for that title, though
 * the item kept its id.
 *
 * @param options - Every request, the catalogue id each film or series read again is held as now,
 *   and the libraries looked into by catalogue ids.
 * @returns Each request whose title went, and what it is held as now, if anything.
 */
const matchRematches = async ({
  requests,
  heldAs,
  lookup,
}: MatchRematchesOptions): Promise<Departure[]> => {
  const departed: Departure[] = [];

  for (const request of requests) {
    if (
      (request.kind !== 'film' && request.kind !== 'series') ||
      request.mediaId === null ||
      request.tmdbId === null ||
      !heldAs.has(request.mediaId) ||
      heldAs.get(request.mediaId) === request.tmdbId.toString()
    ) {
      continue;
    }

    const now = await heldNowAs(request, lookup);

    if (now !== request.mediaId) {
      departed.push({ request, mediaId: now });
    }
  }

  return departed;
};

export { matchRematches };
