import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { adminQueries } from './adminQueries';

const answered = vi.hoisted(() => (value: object) => vi.fn().mockResolvedValue(value));

const admin = vi.hoisted(() => ({
  fetchAdminOverview: vi.fn(),
  fetchRunningScans: vi.fn(),
  fetchMonitor: vi.fn(),
  fetchActiveSessions: vi.fn(),
  fetchJobDefinitions: vi.fn(),
  fetchJobHistory: vi.fn(),
  fetchJobHistoryIssues: vi.fn(),
  fetchJobSchedules: vi.fn(),
}));

const fetchResourceHistory = vi.hoisted(() => vi.fn());
const fetchLogs = vi.hoisted(() => vi.fn());
const fetchLogHistogram = vi.hoisted(() => vi.fn());
const fetchLogFacets = vi.hoisted(() => vi.fn());
const fetchJobStats = vi.hoisted(() => vi.fn());
const fetchJobRun = vi.hoisted(() => vi.fn());

const roles = vi.hoisted(() => ({
  fetchRoles: vi.fn(),
  fetchPermissionCatalogue: vi.fn(),
  fetchAccountPermissions: vi.fn(),
}));

const webhooks = vi.hoisted(() => ({ fetchWebhooks: vi.fn(), fetchWebhookDeliveries: vi.fn() }));
const fetchAccounts = vi.hoisted(() => vi.fn());
const fetchFolders = vi.hoisted(() => vi.fn());
const readWholeLibrary = vi.hoisted(() => vi.fn());
const fetchEverybodysShares = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/admin/fetchAdmin', () => admin);
vi.mock('@ValenceClient/admin/fetchLogs', () => ({ fetchLogs }));
vi.mock('@ValenceClient/admin/fetchLogHistogram', () => ({ fetchLogHistogram }));
vi.mock('@ValenceClient/admin/fetchLogFacets', () => ({ fetchLogFacets }));
vi.mock('@ValenceClient/admin/fetchJobStats', () => ({ fetchJobStats }));
vi.mock('@ValenceClient/admin/fetchJobRun', () => ({ fetchJobRun }));
vi.mock('@ValenceClient/admin/fetchResourceHistory', () => ({ fetchResourceHistory }));
vi.mock('@ValenceClient/admin/fetchRoles', () => roles);
vi.mock('@ValenceClient/admin/fetchWebhooks', () => webhooks);
vi.mock('@ValenceClient/admin/fetchAccounts', () => ({ fetchAccounts }));
vi.mock('@ValenceClient/admin/fetchFolders', () => ({ fetchFolders }));
vi.mock('@ValenceClient/library/readWholeLibrary', () => ({ readWholeLibrary }));
vi.mock('@ValenceClient/sharing/fetchShares', () => ({ fetchEverybodysShares }));

const aCache = (): QueryClient =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });

const aThing = (id: string, seriesTitle: string | null = null) => ({ id, seriesTitle });

beforeEach(() => {
  vi.clearAllMocks();

  for (const [name, said] of Object.entries({
    fetchAdminOverview: { transcoder: {} },
    fetchRunningScans: [],
    fetchMonitor: { resources: {} },
    fetchActiveSessions: [],
    fetchJobDefinitions: [],
    fetchJobHistory: { records: [], total: 0 },
    fetchJobHistoryIssues: [],
    fetchJobSchedules: [],
  })) {
    Object.assign(admin, { [name]: answered(said) });
  }

  fetchResourceHistory.mockResolvedValue([]);
  fetchLogs.mockResolvedValue({ records: [], total: 0 });
  fetchLogHistogram.mockResolvedValue({ fromMs: 0, untilMs: 1, bucketMs: 1000, buckets: [] });
  fetchLogFacets.mockResolvedValue({ sources: [], jobKinds: [] });
  fetchJobStats.mockResolvedValue({ sinceMs: 0, kinds: [] });
  fetchJobRun.mockResolvedValue(null);

  Object.assign(roles, {
    fetchRoles: answered([]),
    fetchPermissionCatalogue: answered([]),
    fetchAccountPermissions: answered({ roles: [] }),
  });

  Object.assign(webhooks, {
    fetchWebhooks: answered([]),
    fetchWebhookDeliveries: answered([]),
  });

  fetchAccounts.mockResolvedValue([]);
  fetchEverybodysShares.mockResolvedValue([]);
  readWholeLibrary.mockResolvedValue([aThing('one')]);
});

describe('adminQueries', () => {
  it('reads everything the server has to say about itself', async () => {
    const cache = aCache();

    await expect(cache.fetchQuery(adminQueries.overview())).resolves.toEqual({ transcoder: {} });
    await expect(cache.fetchQuery(adminQueries.monitor())).resolves.toEqual({ resources: {} });
    await expect(cache.fetchQuery(adminQueries.sessions())).resolves.toEqual([]);
    await expect(cache.fetchQuery(adminQueries.jobs())).resolves.toEqual([]);
    await expect(cache.fetchQuery(adminQueries.schedules())).resolves.toEqual([]);
    await expect(cache.fetchQuery(adminQueries.accounts())).resolves.toEqual([]);
    await expect(cache.fetchQuery(adminQueries.roles())).resolves.toEqual([]);
    await expect(cache.fetchQuery(adminQueries.permissions())).resolves.toEqual([]);
    await expect(cache.fetchQuery(adminQueries.webhooks())).resolves.toEqual([]);
    await expect(cache.fetchQuery(adminQueries.shares())).resolves.toEqual([]);
  });

  it('reads the folders inside one, and does not ask again about one that is not there', async () => {
    const listing = { path: '/media', parent: '/', folders: [], isTruncated: false };

    fetchFolders.mockResolvedValue(listing);

    await expect(aCache().fetchQuery(adminQueries.folders('/media'))).resolves.toEqual(listing);
    expect(fetchFolders).toHaveBeenCalledWith('/media');
    expect(adminQueries.folders(null).retry).toBe(false);
  });

  it('watches a scan on a timer, since a scan finishes without announcing it', () => {
    expect(adminQueries.scans().refetchInterval).toBeGreaterThan(0);
  });

  it('watches an encode on a timer, since it reports progress by writing it down', () => {
    expect(typeof adminQueries.reencodes().refetchInterval).toBe('function');
  });

  it('reads a running scan', async () => {
    await expect(aCache().fetchQuery(adminQueries.scans())).resolves.toEqual([]);
  });

  it('asks nothing about nobody and nothing', () => {
    expect(adminQueries.accountPermissions(null).enabled).toBe(false);
    expect(adminQueries.deliveries(null).enabled).toBe(false);
    expect(adminQueries.everything([]).enabled).toBe(false);
    expect(adminQueries.jobHistoryIssues(null).enabled).toBe(false);
    expect(adminQueries.jobRun(null).enabled).toBe(false);
  });

  it('reads the persisted history of job runs, filtered', async () => {
    await expect(
      aCache().fetchQuery(adminQueries.jobHistory({ search: 'preview' })),
    ).resolves.toEqual({ records: [], total: 0 });

    expect(admin.fetchJobHistory).toHaveBeenCalledWith({ search: 'preview' });
  });

  it('reads the issues one job run accumulated, once asked for', async () => {
    await expect(aCache().fetchQuery(adminQueries.jobHistoryIssues('run-1'))).resolves.toEqual([]);

    expect(admin.fetchJobHistoryIssues).toHaveBeenCalledWith('run-1');
  });

  it('reads a page of the log, filtered', async () => {
    await expect(aCache().fetchQuery(adminQueries.logs({ levels: ['error'] }))).resolves.toEqual({
      records: [],
      total: 0,
    });

    expect(fetchLogs).toHaveBeenCalledWith({ levels: ['error'] });
  });

  it('keeps a page of the log under its own key for each question, so answers are not mixed up', () => {
    expect(adminQueries.logs({ levels: ['error'] }).queryKey).not.toEqual(
      adminQueries.logs({ levels: ['warn'] }).queryKey,
    );
  });

  describe('reading the log a page after another', () => {
    const page = (count: number, total: number) => ({
      records: Array.from({ length: count }, (_, at) => ({
        id: at.toString(),
        atMs: at,
        level: 'info' as const,
        source: 'server' as const,
        message: 'A line',
        detail: null,
        count: 1,
        context: {
          jobId: null,
          jobKind: null,
          libraryId: null,
          mediaId: null,
          sessionId: null,
          requestId: null,
        },
      })),
      total,
    });

    it('starts at the first page, and asks for the next from where the last ended', async () => {
      fetchLogs.mockResolvedValueOnce(page(200, 900)).mockResolvedValueOnce(page(200, 900));

      const cache = aCache();
      const options = adminQueries.logPages({ limit: 200 });

      await cache.prefetchInfiniteQuery({ ...options, pages: 2 });

      expect(fetchLogs).toHaveBeenNthCalledWith(1, { limit: 200, offset: 0 });
      expect(fetchLogs).toHaveBeenNthCalledWith(2, { limit: 200, offset: 200 });
    });

    it('has no next page once everything has been read', () => {
      const { getNextPageParam } = adminQueries.logPages({});
      const first = page(50, 50);

      expect(getNextPageParam(first, [first], 0, [0])).toBeUndefined();
    });

    it('has no next page where the last one came back empty', () => {
      const { getNextPageParam } = adminQueries.logPages({});
      const empty = page(0, 900);

      expect(getNextPageParam(empty, [empty], 0, [0])).toBeUndefined();
    });

    it('stops reading at a couple of thousand lines', () => {
      const { getNextPageParam } = adminQueries.logPages({});
      const full = page(1000, 20_000);

      expect(getNextPageParam(full, [full], 0, [0])).toBe(1000);
      expect(getNextPageParam(full, [full, full], 0, [0, 1000])).toBeUndefined();
    });
  });

  it('reads the log over time, and the sources it comes from', async () => {
    await aCache().fetchQuery(adminQueries.logHistogram({ buckets: 12 }));
    await aCache().fetchQuery(adminQueries.logFacets({ jobId: 'job-1' }));

    expect(fetchLogHistogram).toHaveBeenCalledWith({ buckets: 12 });
    expect(fetchLogFacets).toHaveBeenCalledWith({ jobId: 'job-1' });
  });

  it('reads how each kind of job has gone, and one run by its id', async () => {
    await aCache().fetchQuery(adminQueries.jobStats(500));
    await aCache().fetchQuery(adminQueries.jobRun('run-1'));

    expect(fetchJobStats).toHaveBeenCalledWith(500);
    expect(fetchJobRun).toHaveBeenCalledWith('run-1');
  });

  it('reads a range of the server load history', async () => {
    await expect(aCache().fetchQuery(adminQueries.resourceHistory('24h'))).resolves.toEqual([]);

    expect(fetchResourceHistory).toHaveBeenCalledWith('24h');
  });

  it('reads what one account may do, and how one webhook has been getting on', async () => {
    const cache = aCache();

    await expect(cache.fetchQuery(adminQueries.accountPermissions('somebody'))).resolves.toEqual({
      roles: [],
    });

    await expect(cache.fetchQuery(adminQueries.deliveries('hook'))).resolves.toEqual([]);
  });

  it('lists everything on the server once per thing rather than once per file', async () => {
    readWholeLibrary.mockResolvedValue([
      aThing('ted-s01e01', 'Ted'),
      aThing('ted-s01e02', 'Ted'),
      aThing('arrival'),
    ]);

    await expect(aCache().fetchQuery(adminQueries.everything(['films']))).resolves.toEqual([
      aThing('ted-s01e01', 'Ted'),
      aThing('arrival'),
    ]);
  });
});
