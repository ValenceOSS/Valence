import { queryOptions } from '@tanstack/react-query';
import { fetchBuckets } from '@ValenceClient/admin/fetchBuckets';

const BUCKETS = ['buckets'] as const;

const MOUNTING_LOOKS_EVERY_MS = 3000;

/**
 * The buckets an administrator added and how their mounts are doing, asked again every few seconds
 * while any is still mounting.
 *
 * @returns The query.
 */
const all = () =>
  queryOptions({
    queryKey: [...BUCKETS, 'all'],
    queryFn: () => fetchBuckets(),
    refetchInterval: (query) =>
      query.state.data?.buckets.some((bucket) => bucket.status.state === 'mounting') === true
        ? MOUNTING_LOOKS_EVERY_MS
        : false,
  });

const bucketQueries = { key: BUCKETS, all };

export { bucketQueries };
