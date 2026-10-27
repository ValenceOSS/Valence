import { queryOptions } from '@tanstack/react-query';
import { fetchStreamOffers } from '@ValenceClient/streams/fetchStreamOffers';
import { fetchStreamedLibrary } from '@ValenceClient/streams/fetchStreamedLibrary';

const STREAMS = ['streams'] as const;

const OFFERS_KEPT_MS = 5 * 60 * 1000;

/**
 * What can play a film straight from a source, asked only once somebody asks to play it — opening
 * a film's page tells no source what anybody is looking at — and kept a few minutes, so pressing
 * Play again, or opening the picker after, asks nothing again.
 *
 * @param tmdbId - The film's id in the catalogue.
 * @param isAsked - Whether somebody has asked to play it yet.
 * @returns The query.
 */
const offers = (tmdbId: number, isAsked: boolean) =>
  queryOptions({
    queryKey: [...STREAMS, 'offers', tmdbId],
    queryFn: () => fetchStreamOffers(tmdbId),
    enabled: isAsked,
    staleTime: OFFERS_KEPT_MS,
    retry: false,
  });

/**
 * The hidden library films played from sources are kept in, asked once, for reading what somebody
 * is part way through from it.
 *
 * @param isEnabled - Whether this server plays films from sources at all.
 * @returns The query.
 */
const library = (isEnabled: boolean) =>
  queryOptions({
    queryKey: [...STREAMS, 'library'],
    queryFn: () => fetchStreamedLibrary(),
    enabled: isEnabled,
    staleTime: Infinity,
    retry: false,
  });

const streamQueries = { offers, library, key: STREAMS };

export { streamQueries };
