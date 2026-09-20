import { queryOptions } from '@tanstack/react-query';
import {
  fetchRequestsAvailability,
  fetchRequestsOverview,
} from '@ValenceClient/requests/fetchRequests';

const REQUESTS = ['requests'] as const;

const OVERVIEW_EVERY_MS = 30_000;

/**
 * Whether this server takes requests, which only changes when the server is restarted with or
 * without the requests service, so it is read once and kept.
 *
 * @returns The query.
 */
const availability = () =>
  queryOptions({
    queryKey: [...REQUESTS, 'availability'],
    queryFn: () => fetchRequestsAvailability(),
    staleTime: Infinity,
  });

/**
 * What the server last heard from the requests service, asked again every half a minute so a VPN
 * that drops is seen without reloading.
 *
 * @param isEnabled - Whether to ask at all, which only makes sense once requesting is known to be on.
 * @returns The query.
 */
const overview = (isEnabled = true) =>
  queryOptions({
    queryKey: [...REQUESTS, 'overview'],
    queryFn: () => fetchRequestsOverview(),
    refetchInterval: OVERVIEW_EVERY_MS,
    enabled: isEnabled,
  });

const requestsQueries = { key: REQUESTS, availability, overview };

export { requestsQueries };
