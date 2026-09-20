import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requestsQueries } from './requestsQueries';

const fetchRequestsAvailability = vi.hoisted(() => vi.fn());
const fetchRequestsOverview = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/requests/fetchRequests', () => ({
  fetchRequestsAvailability,
  fetchRequestsOverview,
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
});
