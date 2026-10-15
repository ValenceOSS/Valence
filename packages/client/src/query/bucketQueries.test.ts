import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bucketQueries } from './bucketQueries';

const fetchBuckets = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/admin/fetchBuckets', () => ({ fetchBuckets }));

const aCache = (): QueryClient =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });

beforeEach(() => {
  vi.clearAllMocks();

  fetchBuckets.mockResolvedValue({ canMount: true, buckets: [] });
});

describe('bucketQueries', () => {
  it('asks for the buckets', async () => {
    await expect(aCache().fetchQuery(bucketQueries.all())).resolves.toEqual({
      canMount: true,
      buckets: [],
    });
  });

  it('sits under its own key', () => {
    expect(bucketQueries.all().queryKey.slice(0, 1)).toEqual(bucketQueries.key);
  });
});
