import { readFromServer } from '@ValenceClient/query/readFromServer';
import { StreamOffersSchema } from '@ValenceContracts/schemas/StreamOffer';
import type { StreamOffers } from '@ValenceContracts/schemas/StreamOffer';

/**
 * Reads what can play a film straight from the sources plugins offer.
 *
 * @param tmdbId - The film's id in the catalogue.
 * @param isFresh - Whether to ask every source again rather than take what was found a moment ago.
 * @returns What can play it, and which sources could not say.
 */
const fetchStreamOffers = (tmdbId: number, isFresh = false): Promise<StreamOffers> =>
  readFromServer(
    `/api/streams/films/${tmdbId.toString()}${isFresh ? '?fresh=true' : ''}`,
    StreamOffersSchema,
  );

export { fetchStreamOffers };
