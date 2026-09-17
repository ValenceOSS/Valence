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

  it('reads a running scan', async () => {
    await expect(aCache().fetchQuery(adminQueries.scans())).resolves.toEqual([]);
  });

  it('asks nothing about nobody and nothing', () => {
    expect(adminQueries.accountPermissions(null).enabled).toBe(false);
    expect(adminQueries.deliveries(null).enabled).toBe(false);
    expect(adminQueries.everything([]).enabled).toBe(false);
    expect(adminQueries.jobHistoryIssues(null).enabled).toBe(false);
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
