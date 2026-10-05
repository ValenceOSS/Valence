import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requestsQueries } from './requestsQueries';

const fetchRequestsAvailability = vi.hoisted(() => vi.fn());
const fetchRequestsOverview = vi.hoisted(() => vi.fn());

const fetchIndexers = vi.hoisted(() => vi.fn());
const searchReleases = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/requests/fetchRequests', () => ({
  fetchRequestsAvailability,
  fetchRequestsOverview,
}));

vi.mock('@ValenceClient/requests/fetchIndexers', () => ({ fetchIndexers, searchReleases }));

const fetchCatalogue = vi.hoisted(() => vi.fn());
const fetchDefinition = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/requests/fetchDefinitions', () => ({ fetchCatalogue, fetchDefinition }));

const fetchDownloadClients = vi.hoisted(() => vi.fn());
const fetchDownloadQueue = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/requests/fetchDownloadClients', () => ({ fetchDownloadClients }));

vi.mock('@ValenceClient/requests/fetchDownloadQueue', () => ({ fetchDownloadQueue }));

const fetchArrApps = vi.hoisted(() => vi.fn());
const fetchArrAppChoices = vi.hoisted(() => vi.fn());
const fetchArrQueue = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/requests/fetchArrApps', () => ({
  fetchArrApps,
  fetchArrAppChoices,
  fetchArrQueue,
}));

const fetchGiveUpRules = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/requests/fetchGiveUpRules', () => ({ fetchGiveUpRules }));

const fetchProfiles = vi.hoisted(() => vi.fn());
const fetchProfilesOnOffer = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/requests/fetchProfiles', () => ({ fetchProfiles, fetchProfilesOnOffer }));

const fetchSeerrLink = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/requests/fetchSeerrLink', () => ({ fetchSeerrLink }));

const askables = vi.hoisted(() => ({
  fetchAskable: vi.fn(),
  fetchCatalogueBrowse: vi.fn(),
  fetchCatalogueGenres: vi.fn(),
  fetchDiscover: vi.fn(),
  fetchRequestProgress: vi.fn(),
  findMissingAlbums: vi.fn(() => Promise.resolve({ isMatching: false, albums: [] })),
  searchAskable: vi.fn(),
}));

vi.mock('@ValenceClient/requests/fetchAskable', () => askables);

const fetchMediaRequests = vi.hoisted(() => vi.fn());
const fetchMediaRequestReleases = vi.hoisted(() => vi.fn());
const fetchMediaRequestLog = vi.hoisted(() => vi.fn());
const fetchSeriesSeasons = vi.hoisted(() => vi.fn());
const fetchRequestBlocklist = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/requests/fetchMediaRequests', () => ({
  fetchRequestBlocklist,
  fetchMediaRequests,
  fetchMediaRequestReleases,
  fetchMediaRequestLog,
  fetchSeriesSeasons,
}));

const aCache = (): QueryClient =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });

beforeEach(() => {
  vi.clearAllMocks();

  fetchRequestsAvailability.mockResolvedValue({ isEnabled: true });
  fetchRequestsOverview.mockResolvedValue({
    address: 'http://requests:8421',
    isReachable: false,
    checkedAt: null,
    status: null,
  });
});

describe('requestsQueries', () => {
  it('asks whether requesting is on, and asks again once the answer is a few minutes old', async () => {
    await expect(aCache().fetchQuery(requestsQueries.availability())).resolves.toEqual({
      isEnabled: true,
    });
    expect(requestsQueries.availability().staleTime).toBe(5 * 60 * 1000);
  });

  it('asks what the server last heard from the service', async () => {
    await expect(aCache().fetchQuery(requestsQueries.overview())).resolves.toMatchObject({
      address: 'http://requests:8421',
    });
  });

  it('keeps asking about the service while it is on screen', () => {
    expect(requestsQueries.overview().refetchInterval).toBe(30_000);
  });

  it('asks nothing about the service until requesting is known to be on', () => {
    expect(requestsQueries.overview(false).enabled).toBe(false);
  });

  it('keeps everything about requesting under one key', () => {
    expect(requestsQueries.overview().queryKey.slice(0, 1)).toEqual(requestsQueries.key);
    expect(requestsQueries.availability().queryKey.slice(0, 1)).toEqual(requestsQueries.key);
  });

  it('asks for the connected apps, their queues, and an app’s choices once one is chosen', async () => {
    fetchArrApps.mockResolvedValue([]);
    fetchArrQueue.mockResolvedValue({ apps: [], items: [] });
    fetchArrAppChoices.mockResolvedValue({ rootFolders: [] });

    await expect(aCache().fetchQuery(requestsQueries.arrApps())).resolves.toEqual([]);
    await expect(aCache().fetchQuery(requestsQueries.arrQueue())).resolves.toEqual({
      apps: [],
      items: [],
    });
    await expect(aCache().fetchQuery(requestsQueries.arrAppChoices('radarr'))).resolves.toEqual({
      rootFolders: [],
    });
    expect(fetchArrAppChoices).toHaveBeenCalledWith('radarr');
    expect(requestsQueries.arrAppChoices(null).enabled).toBe(false);
    expect(requestsQueries.arrApps(false).enabled).toBe(false);
    expect(requestsQueries.arrQueue().refetchInterval).toBe(5000);
  });

  it('asks for the indexers', async () => {
    fetchIndexers.mockResolvedValue([]);

    await expect(aCache().fetchQuery(requestsQueries.indexers())).resolves.toEqual([]);
  });

  it('searches only once something has been asked, and keeps each search apart', async () => {
    searchReleases.mockResolvedValue({ releases: [], indexers: [] });

    expect(requestsQueries.search(null).enabled).toBe(false);
    await expect(aCache().fetchQuery(requestsQueries.search({ query: 'dune' }))).resolves.toEqual({
      releases: [],
      indexers: [],
    });
    expect(searchReleases).toHaveBeenCalledWith({ query: 'dune' });
    expect(requestsQueries.search({ query: 'a' }).queryKey).not.toEqual(
      requestsQueries.search({ query: 'b' }).queryKey,
    );
  });

  it('asks for the catalogue, and for one definition only once one is chosen', async () => {
    fetchCatalogue.mockResolvedValue({ definitions: [] });
    fetchDefinition.mockResolvedValue({ id: '1337x' });

    await expect(aCache().fetchQuery(requestsQueries.catalogue())).resolves.toEqual({
      definitions: [],
    });
    expect(requestsQueries.definition(null).enabled).toBe(false);
    await expect(aCache().fetchQuery(requestsQueries.definition('1337x'))).resolves.toEqual({
      id: '1337x',
    });
    expect(fetchDefinition).toHaveBeenCalledWith('1337x');
  });

  it('asks for the download clients, and the queue', async () => {
    fetchDownloadClients.mockResolvedValue([]);
    fetchDownloadQueue.mockResolvedValue({ clients: [], downloads: [], checkedAt: null });

    await expect(aCache().fetchQuery(requestsQueries.downloadClients())).resolves.toEqual([]);
    await expect(aCache().fetchQuery(requestsQueries.downloadQueue())).resolves.toEqual({
      clients: [],
      downloads: [],
      checkedAt: null,
    });
  });

  it('asks for when a download is given up on', async () => {
    fetchGiveUpRules.mockResolvedValue({ stalledHours: 6 });

    await expect(aCache().fetchQuery(requestsQueries.giveUpRules())).resolves.toEqual({
      stalledHours: 6,
    });
  });

  it('asks for the quality profiles', async () => {
    fetchProfiles.mockResolvedValue([]);

    await expect(aCache().fetchQuery(requestsQueries.profiles())).resolves.toEqual([]);
  });

  it('asks for the requests, and what a search by hand found for one', async () => {
    fetchMediaRequests.mockResolvedValue([]);
    fetchMediaRequestReleases.mockResolvedValue({ releases: [] });

    await expect(aCache().fetchQuery(requestsQueries.mediaRequests())).resolves.toEqual([]);
    expect(requestsQueries.mediaRequestReleases(null).enabled).toBe(false);
    await expect(
      aCache().fetchQuery(requestsQueries.mediaRequestReleases('dune')),
    ).resolves.toEqual({ releases: [] });
    expect(fetchMediaRequestReleases).toHaveBeenCalledWith('dune');

    fetchSeriesSeasons.mockResolvedValue([]);

    expect(requestsQueries.seriesSeasons(null).enabled).toBe(false);
    await expect(aCache().fetchQuery(requestsQueries.seriesSeasons(95396))).resolves.toEqual([]);
    expect(fetchSeriesSeasons).toHaveBeenCalledWith(95396);

    fetchMediaRequestLog.mockResolvedValue([]);

    expect(requestsQueries.mediaRequestLog(null).enabled).toBe(false);
    await expect(aCache().fetchQuery(requestsQueries.mediaRequestLog('dune'))).resolves.toEqual([]);
  });

  it('asks for the requests again only while one of them is on its way', async () => {
    vi.useFakeTimers();

    const asksOverAMinute = async (requests: { state: string }[]): Promise<number> => {
      fetchMediaRequests.mockClear().mockResolvedValue(requests);

      const stop = new QueryObserver(aCache(), requestsQueries.mediaRequests()).subscribe(
        () => undefined,
      );

      await vi.advanceTimersByTimeAsync(60_000);
      stop();

      return fetchMediaRequests.mock.calls.length;
    };

    expect(await asksOverAMinute([{ state: 'filed' }, { state: 'wanted' }])).toBe(1);
    expect(await asksOverAMinute([{ state: 'filed' }, { state: 'downloading' }])).toBeGreaterThan(
      1,
    );

    vi.useRealTimers();
  });

  it('asks how downloads are going every few seconds, and only while asked to', () => {
    expect(requestsQueries.requestProgress().refetchInterval).toBe(5000);
    expect(requestsQueries.requestProgress(false).enabled).toBe(false);
  });

  it('keeps the link to Overseerr and Jellyseerr among the requests', () => {
    expect(requestsQueries.seerrLink().queryKey).toEqual(['requests', 'seerrLink']);
  });

  it('asks for what may be asked for, found, browsed and followed, each only once it can be', async () => {
    const cache = aCache();
    const browsing = { kind: 'film', list: 'popular', studio: null } as const;

    fetchProfilesOnOffer.mockResolvedValue([]);
    fetchRequestBlocklist.mockResolvedValue([]);
    fetchSeerrLink.mockResolvedValue({ isLinked: false });
    askables.fetchDiscover.mockResolvedValue({ shelves: [] });
    askables.fetchCatalogueBrowse.mockResolvedValue({ page: 1, hasMore: true, titles: [] });
    askables.fetchCatalogueGenres.mockResolvedValue([]);
    askables.searchAskable.mockResolvedValue([]);
    askables.fetchAskable.mockResolvedValue({ id: '1' });
    askables.fetchRequestProgress.mockResolvedValue([]);

    await cache.fetchQuery(requestsQueries.profilesOnOffer('film'));
    await cache.fetchQuery(requestsQueries.requestBlocklist('req'));
    await cache.fetchQuery(requestsQueries.seerrLink());
    await cache.fetchQuery(requestsQueries.discover());
    await cache.fetchQuery(requestsQueries.catalogueGenres('film'));
    await cache.fetchQuery(requestsQueries.askableSearch('dune', 'film'));
    await cache.fetchQuery(requestsQueries.askable('film', '1'));
    await cache.fetchQuery(requestsQueries.missingAlbums('playlist-1'));
    await cache.fetchQuery(requestsQueries.requestProgress());

    const browse = requestsQueries.catalogueBrowse(browsing, true, { genre: '18' });

    await cache.fetchInfiniteQuery(browse);

    expect(fetchProfilesOnOffer).toHaveBeenCalledWith('film');
    expect(fetchRequestBlocklist).toHaveBeenCalledWith('req');
    expect(fetchSeerrLink).toHaveBeenCalledOnce();
    expect(askables.fetchDiscover).toHaveBeenCalledOnce();
    expect(askables.fetchCatalogueGenres).toHaveBeenCalledWith('film');
    expect(askables.searchAskable).toHaveBeenCalledWith('dune', 'film');
    expect(askables.fetchAskable).toHaveBeenCalledWith('film', '1');
    expect(askables.findMissingAlbums).toHaveBeenCalledWith('playlist-1');
    expect(askables.fetchRequestProgress).toHaveBeenCalledOnce();
    expect(askables.fetchCatalogueBrowse).toHaveBeenCalledWith(browsing, 1, { genre: '18' });
    expect(browse.getNextPageParam({ page: 1, hasMore: true, titles: [] }, [], 1, [])).toBe(2);
    expect(
      browse.getNextPageParam({ page: 3, hasMore: false, titles: [] }, [], 3, []),
    ).toBeUndefined();
    expect(requestsQueries.profilesOnOffer('film', false).enabled).toBe(false);
    expect(requestsQueries.requestBlocklist(null).enabled).toBe(false);
    expect(requestsQueries.askableSearch(' ', 'film').enabled).toBe(false);
    expect(requestsQueries.askable('film', null).enabled).toBe(false);
    expect(requestsQueries.missingAlbums('playlist-1', false).enabled).toBe(false);
  });
});
