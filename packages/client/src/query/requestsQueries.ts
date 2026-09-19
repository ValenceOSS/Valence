import { queryOptions } from '@tanstack/react-query';
import {
  fetchRequestsAvailability,
  fetchRequestsOverview,
} from '@ValenceClient/requests/fetchRequests';
import { fetchIndexers, searchReleases } from '@ValenceClient/requests/fetchIndexers';
import { fetchCatalogue, fetchDefinition } from '@ValenceClient/requests/fetchDefinitions';
import { fetchDownloadClients } from '@ValenceClient/requests/fetchDownloadClients';
import { fetchDownloadQueue } from '@ValenceClient/requests/fetchDownloadQueue';
import { fetchProfiles } from '@ValenceClient/requests/fetchProfiles';
import {
  fetchMediaRequestReleases,
  fetchMediaRequests,
} from '@ValenceClient/requests/fetchMediaRequests';
import type { ReleaseSearch } from '@ValenceContracts/schemas/Indexer';

const REQUESTS = ['requests'] as const;

const OVERVIEW_EVERY_MS = 30_000;

const MEDIA_REQUESTS_EVERY_MS = 5000;

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

/**
 * The indexers requesting searches.
 *
 * @returns The query.
 */
const indexers = () =>
  queryOptions({
    queryKey: [...REQUESTS, 'indexers'],
    queryFn: () => fetchIndexers(),
  });

/**
 * What every indexer found for a search, asked once and kept for as long as the page is open, so
 * going back to the same search does not ask every indexer again.
 *
 * @param asked - What to look for, or nothing before anything has been searched for.
 * @returns The query.
 */
const search = (asked: ReleaseSearch | null) =>
  queryOptions({
    queryKey: [...REQUESTS, 'search', asked],
    queryFn: () => searchReleases(asked ?? {}),
    enabled: asked !== null,
    staleTime: Infinity,
    retry: false,
  });

/**
 * The catalogue of sites Valence has definitions for.
 *
 * @returns The query.
 */
const catalogue = () =>
  queryOptions({
    queryKey: [...REQUESTS, 'catalogue'],
    queryFn: () => fetchCatalogue(),
    staleTime: 60_000,
  });

/**
 * One definition, with the settings it asks for, which only changes when the catalogue does.
 *
 * @param id - Which, or nothing before one is chosen.
 * @returns The query.
 */
const definition = (id: string | null) =>
  queryOptions({
    queryKey: [...REQUESTS, 'definition', id],
    queryFn: () => fetchDefinition(id ?? ''),
    enabled: id !== null,
    staleTime: Infinity,
  });

/**
 * The download clients releases are sent to.
 *
 * @returns The query.
 */
const downloadClients = () =>
  queryOptions({
    queryKey: [...REQUESTS, 'clients'],
    queryFn: () => fetchDownloadClients(),
  });

/**
 * Every download Valence has sent, and how each client is — read once, then kept up to date by the
 * live connection rather than asked for again.
 *
 * @returns The query.
 */
const downloadQueue = () =>
  queryOptions({
    queryKey: [...REQUESTS, 'downloads'],
    queryFn: () => fetchDownloadQueue(),
  });

/**
 * The quality profiles searches are judged against.
 *
 * @returns The query.
 */
const profiles = () =>
  queryOptions({
    queryKey: [...REQUESTS, 'profiles'],
    queryFn: () => fetchProfiles(),
  });

/**
 * The requests for films and series somebody may see, asked again every few seconds while they are
 * on screen, so a request can be watched moving from being searched for to being ready.
 *
 * @returns The query.
 */
const mediaRequests = () =>
  queryOptions({
    queryKey: [...REQUESTS, 'media'],
    queryFn: () => fetchMediaRequests(),
    refetchInterval: MEDIA_REQUESTS_EVERY_MS,
  });

/**
 * What a search by hand found for one request, asked once and kept while the page is open.
 *
 * @param id - Which request, or nothing before one is chosen.
 * @returns The query.
 */
const mediaRequestReleases = (id: string | null) =>
  queryOptions({
    queryKey: [...REQUESTS, 'media', id, 'releases'],
    queryFn: () => fetchMediaRequestReleases(id ?? ''),
    enabled: id !== null,
    staleTime: Infinity,
    retry: false,
  });

const requestsQueries = {
  key: REQUESTS,
  availability,
  overview,
  indexers,
  search,
  catalogue,
  definition,
  downloadClients,
  downloadQueue,
  profiles,
  mediaRequests,
  mediaRequestReleases,
};

export { requestsQueries };
