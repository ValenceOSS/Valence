import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import {
  fetchRequestsAvailability,
  fetchRequestsOverview,
} from '@ValenceClient/requests/fetchRequests';
import { fetchIndexers, searchReleases } from '@ValenceClient/requests/fetchIndexers';
import { fetchCatalogue, fetchDefinition } from '@ValenceClient/requests/fetchDefinitions';
import { fetchDownloadClients } from '@ValenceClient/requests/fetchDownloadClients';
import {
  fetchArrAppChoices,
  fetchArrApps,
  fetchArrQueue,
} from '@ValenceClient/requests/fetchArrApps';
import { fetchDownloadQueue } from '@ValenceClient/requests/fetchDownloadQueue';
import { fetchGiveUpRules } from '@ValenceClient/requests/fetchGiveUpRules';
import { fetchSeerrLink } from '@ValenceClient/requests/fetchSeerrLink';
import { askAgainWhileMatching } from '@ValenceClient/requests/askAgainWhileMatching';
import { fetchProfiles, fetchProfilesOnOffer } from '@ValenceClient/requests/fetchProfiles';
import { fetchTitleCatalogue, fetchTitleFiles } from '@ValenceClient/requests/fetchTitleCatalogue';
import {
  fetchRequestBlocklist,
  fetchHandedTo,
  fetchHandOffDownloads,
  fetchMediaRequestLog,
  fetchMediaRequestReleases,
  fetchMediaRequests,
  fetchSeriesSeasons,
} from '@ValenceClient/requests/fetchMediaRequests';
import {
  fetchAskable,
  fetchCatalogueBrowse,
  fetchCatalogueGenres,
  fetchDiscover,
  fetchRequestProgress,
  findMissingAlbums,
  searchAskable,
} from '@ValenceClient/requests/fetchAskable';
import type { CatalogueBrowse, CatalogueFilters } from '@ValenceContracts/schemas/CatalogueTitle';
import type { ReleaseSearch } from '@ValenceContracts/schemas/Indexer';
import type {
  MediaRequestKind,
  MediaRequestState,
  SearchScope,
} from '@ValenceContracts/schemas/MediaRequest';

const REQUESTS = ['requests'] as const;

const OVERVIEW_EVERY_MS = 30_000;

const MEDIA_REQUESTS_EVERY_MS = 5000;

const PROGRESS_EVERY_MS = 5000;

const STILL_MOVING: ReadonlySet<MediaRequestState> = new Set([
  'searching',
  'chosen',
  'downloading',
  'filing',
]);

const DISCOVER_KEPT_MS = 10 * 60 * 1000;

const AVAILABILITY_KEPT_MS = 5 * 60 * 1000;

/**
 * Whether this server takes requests. It seldom changes, but it is read again every few minutes
 * rather than kept for good, since an answer kept for good outlives the server and the account it
 * came from — a phone that moves between servers, or signs in as somebody else, would go on
 * believing the first answer it was given.
 *
 * @returns The query.
 */
const availability = () =>
  queryOptions({
    queryKey: [...REQUESTS, 'availability'],
    queryFn: () => fetchRequestsAvailability(),
    staleTime: AVAILABILITY_KEPT_MS,
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
 * When a download is given up on and the next best release tried.
 */
const giveUpRules = () =>
  queryOptions({
    queryKey: [...REQUESTS, 'give-up-rules'],
    queryFn: () => fetchGiveUpRules(),
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
 * The qualities somebody may ask at for something.
 *
 * @param kind - What is being asked for.
 * @param isEnabled - Whether to ask at all, which a dialog that is shut does not.
 * @returns The query.
 */
const profilesOnOffer = (kind: MediaRequestKind, isEnabled = true) =>
  queryOptions({
    queryKey: [...REQUESTS, 'profiles', 'onOffer', kind],
    queryFn: () => fetchProfilesOnOffer(kind),
    enabled: isEnabled,
  });

/**
 * The requests for films and series somebody may see, asked again every few seconds while any of
 * them is on its way, so a request can be watched moving from being searched for to being ready.
 *
 * @returns The query.
 */
const mediaRequests = () =>
  queryOptions({
    queryKey: [...REQUESTS, 'media'],
    queryFn: () => fetchMediaRequests(),
    refetchInterval: (query) =>
      (query.state.data ?? []).some((request) => STILL_MOVING.has(request.state))
        ? MEDIA_REQUESTS_EVERY_MS
        : false,
  });

/**
 * The admin Catalogue, read again every few seconds while anything in it is on its way, so a title
 * can be watched into the library from its tile.
 *
 * @returns The query.
 */
const titleCatalogue = () =>
  queryOptions({
    queryKey: [...REQUESTS, 'catalogue'],
    queryFn: () => fetchTitleCatalogue(),
    refetchInterval: (query) =>
      (query.state.data ?? []).some((entry) => entry.status === 'downloading')
        ? MEDIA_REQUESTS_EVERY_MS
        : false,
  });

/**
 * The files the libraries hold of one title, read when its page is open.
 *
 * @param kind - What it is.
 * @param catalogueId - The id it is known by, or nothing for a title known by none.
 * @returns The query.
 */
const titleFiles = (kind: MediaRequestKind, catalogueId: string | null) =>
  queryOptions({
    queryKey: [...REQUESTS, 'catalogue', kind, catalogueId, 'files'],
    queryFn: () => fetchTitleFiles(kind, catalogueId ?? ''),
    enabled: catalogueId !== null,
  });

/**
 * What a search by hand found for one request, asked once and kept while the page is open.
 *
 * @param id - Which request, or nothing before one is chosen.
 * @param scope - The season or episode the search is narrowed to, or nothing for all of it.
 * @returns The query.
 */
const mediaRequestReleases = (id: string | null, scope: SearchScope | null = null) =>
  queryOptions({
    queryKey: [...REQUESTS, 'media', id, 'releases', scope?.season ?? null, scope?.episode ?? null],
    queryFn: () => fetchMediaRequestReleases(id ?? '', scope),
    enabled: id !== null,
    staleTime: Infinity,
    retry: false,
  });

/**
 * What one request has done, read again every few seconds while it is open, so a search can be
 * followed as it goes.
 *
 * @param id - Which request, or nothing before one is chosen.
 * @returns The query.
 */
const mediaRequestLog = (id: string | null) =>
  queryOptions({
    queryKey: [...REQUESTS, 'media', id, 'log'],
    queryFn: () => fetchMediaRequestLog(id ?? ''),
    enabled: id !== null,
    refetchInterval: MEDIA_REQUESTS_EVERY_MS,
  });

/**
 * The releases one request will not try again, read when its page is open.
 *
 * @param id - Which request, or nothing before one is chosen.
 * @returns The query.
 */
const requestBlocklist = (id: string | null) =>
  queryOptions({
    queryKey: [...REQUESTS, 'media', id, 'blocklist'],
    queryFn: () => fetchRequestBlocklist(id ?? ''),
    enabled: id !== null,
  });

/**
 * Which connected app a request was handed to, read when its page is open and only for one that
 * was handed to an app.
 *
 * @param id - Which request, or nothing where it was not handed to one.
 * @returns The query.
 */
const handedTo = (id: string | null) =>
  queryOptions({
    queryKey: [...REQUESTS, 'media', id, 'handed-to'],
    queryFn: () => fetchHandedTo(id ?? ''),
    enabled: id !== null,
  });

/**
 * What the connected app a request was handed to is downloading for it, read when its page is
 * open and only where Valence controls the app.
 *
 * @param id - Which request, or nothing where it is not worked through its app.
 * @returns The query.
 */
const handOffDownloads = (id: string | null) =>
  queryOptions({
    queryKey: [...REQUESTS, 'media', id, 'hand-off', 'downloads'],
    queryFn: () => fetchHandOffDownloads(id ?? ''),
    enabled: id !== null,
  });

/**
 * The seasons a series has, which only change when a new one is announced, so they are kept for
 * an hour.
 *
 * @param tmdbId - The series' catalogue id, or nothing before one is chosen.
 * @returns The query.
 */
const seriesSeasons = (tmdbId: number | null) =>
  queryOptions({
    queryKey: [...REQUESTS, 'seasons', tmdbId],
    queryFn: () => fetchSeriesSeasons(tmdbId ?? 0),
    enabled: tmdbId !== null,
    staleTime: 60 * 60 * 1000,
  });

/**
 * The shelves of things to ask for, kept for a few minutes, since what is trending changes by the
 * day rather than the second.
 *
 * @param isEnabled - Whether to ask at all, which only makes sense once asking is allowed.
 * @returns The query.
 */
const discover = (isEnabled = true) =>
  queryOptions({
    queryKey: [...REQUESTS, 'discover'],
    queryFn: () => fetchDiscover(),
    staleTime: DISCOVER_KEPT_MS,
    enabled: isEnabled,
  });

/**
 * A whole list of films or series to ask for, a page at a time, so a page of them can be scrolled
 * through without end. Kept for a few minutes, as the shelves are.
 *
 * @param browsing - Which list, of which kind, and whose studio where one was chosen.
 * @param isEnabled - Whether to ask at all.
 * @param filters - What to narrow it by: a genre, a span of years, a least rating.
 * @returns The query.
 */
const catalogueBrowse = (
  browsing: CatalogueBrowse,
  isEnabled = true,
  filters: CatalogueFilters = {},
) =>
  infiniteQueryOptions({
    queryKey: [
      ...REQUESTS,
      'browse',
      browsing.kind,
      browsing.list,
      browsing.studio,
      filters.genre ?? null,
      filters.yearFrom ?? null,
      filters.yearTo ?? null,
      filters.minRating ?? null,
    ],
    queryFn: ({ pageParam }) => fetchCatalogueBrowse(browsing, pageParam, filters),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    staleTime: DISCOVER_KEPT_MS,
    enabled: isEnabled,
  });

/**
 * The genres a list of films or series can be narrowed to. They change with the catalogue's own
 * revisions, not with anything a viewer does, so they are kept for as long as the shelves are.
 *
 * @param kind - Whether it is films or series.
 * @param isEnabled - Whether to ask at all.
 * @returns The query.
 */
const catalogueGenres = (kind: CatalogueBrowse['kind'], isEnabled = true) =>
  queryOptions({
    queryKey: [...REQUESTS, 'genres', kind],
    queryFn: () => fetchCatalogueGenres(kind),
    staleTime: DISCOVER_KEPT_MS,
    enabled: isEnabled,
  });

/**
 * What the catalogue has of a kind under a name, to ask for.
 *
 * @param query - What was typed, or nothing where nothing has been.
 * @param kind - Which kind is looked for.
 * @param isEnabled - Whether to ask at all.
 * @returns The query.
 */
const askableSearch = (query: string, kind: MediaRequestKind, isEnabled = true) =>
  queryOptions({
    queryKey: [...REQUESTS, 'askable', 'search', kind, query],
    queryFn: () => searchAskable(query, kind),
    staleTime: DISCOVER_KEPT_MS,
    enabled: isEnabled && query.trim() !== '',
  });

/**
 * The albums of a playlist's missing songs, to ask for them: starting the search where it is not
 * under way, and asked again every moment and a half while it is, so each album fills in as the
 * server finds it.
 *
 * @param playlistId - The playlist.
 * @param isEnabled - Whether to ask at all, which nothing shut needs.
 * @returns The query.
 */
const missingAlbums = (playlistId: string, isEnabled = true) =>
  queryOptions({
    queryKey: [...REQUESTS, 'missingAlbums', playlistId],
    queryFn: () => findMissingAlbums(playlistId),
    enabled: isEnabled,
    refetchInterval: ({ state }) => askAgainWhileMatching(state.data),
  });

/**
 * One title that can be asked for, as its page shows it.
 *
 * @param kind - What kind of title it is.
 * @param id - The id it was listed under, or nothing before one is chosen.
 * @returns The query.
 */
const askable = (kind: MediaRequestKind, id: string | null) =>
  queryOptions({
    queryKey: [...REQUESTS, 'askable', kind, id],
    queryFn: () => fetchAskable(kind, id ?? ''),
    enabled: id !== null,
  });

/**
 * How your downloads are going, asked every few seconds while they are on screen.
 *
 * @param isEnabled - Whether to ask at all.
 * @returns The query.
 */
const requestProgress = (isEnabled = true) =>
  queryOptions({
    queryKey: [...REQUESTS, 'progress'],
    queryFn: () => fetchRequestProgress(),
    refetchInterval: PROGRESS_EVERY_MS,
    enabled: isEnabled,
  });

/**
 * How Overseerr or Jellyseerr reaches Valence as Radarr and Sonarr.
 *
 * @returns The query.
 */
const seerrLink = () =>
  queryOptions({
    queryKey: [...REQUESTS, 'seerrLink'],
    queryFn: () => fetchSeerrLink(),
  });

const ARR_QUEUE_EVERY_MS = 5000;

/**
 * The connected Radarr, Sonarr, Lidarr and Prowlarr apps.
 *
 * @param isEnabled - Whether to ask at all.
 * @returns The query.
 */
const arrApps = (isEnabled = true) =>
  queryOptions({
    queryKey: [...REQUESTS, 'arr-apps'],
    queryFn: () => fetchArrApps(),
    enabled: isEnabled,
  });

/**
 * The root folders and profiles a library handed to an app may choose from.
 *
 * @param id - The app, where one is chosen.
 * @returns The query.
 */
const arrAppChoices = (id: string | null) =>
  queryOptions({
    queryKey: [...REQUESTS, 'arr-apps', id, 'choices'],
    queryFn: () => fetchArrAppChoices(id ?? ''),
    enabled: id !== null,
  });

/**
 * What each connected Radarr, Sonarr and Lidarr has in its queue, read again every few seconds
 * while it is shown.
 *
 * @param isEnabled - Whether to ask at all.
 * @returns The query.
 */
const arrQueue = (isEnabled = true) =>
  queryOptions({
    queryKey: [...REQUESTS, 'arr-apps', 'queue'],
    queryFn: () => fetchArrQueue(),
    refetchInterval: ARR_QUEUE_EVERY_MS,
    enabled: isEnabled,
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
  giveUpRules,
  profiles,
  profilesOnOffer,
  mediaRequests,
  titleCatalogue,
  titleFiles,
  mediaRequestReleases,
  mediaRequestLog,
  requestBlocklist,
  handedTo,
  handOffDownloads,
  seriesSeasons,
  discover,
  catalogueBrowse,
  catalogueGenres,
  askableSearch,
  missingAlbums,
  askable,
  requestProgress,
  seerrLink,
  arrApps,
  arrAppChoices,
  arrQueue,
};

export { requestsQueries };
