import { QueryClient } from '@tanstack/react-query';
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

const fetchProfiles = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/requests/fetchProfiles', () => ({ fetchProfiles }));

const fetchMediaRequests = vi.hoisted(() => vi.fn());
const fetchMediaRequestReleases = vi.hoisted(() => vi.fn());
const fetchMediaRequestLog = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/requests/fetchMediaRequests', () => ({
  fetchMediaRequests,
  fetchMediaRequestReleases,
  fetchMediaRequestLog,
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
  it('asks whether requesting is on, and keeps the answer', async () => {
    await expect(aCache().fetchQuery(requestsQueries.availability())).resolves.toEqual({
      isEnabled: true,
    });
    expect(requestsQueries.availability().staleTime).toBe(Infinity);
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

    fetchMediaRequestLog.mockResolvedValue([]);

    expect(requestsQueries.mediaRequestLog(null).enabled).toBe(false);
    await expect(aCache().fetchQuery(requestsQueries.mediaRequestLog('dune'))).resolves.toEqual([]);
  });
});
