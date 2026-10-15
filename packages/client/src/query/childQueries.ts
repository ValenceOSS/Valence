import { queryOptions } from '@tanstack/react-query';
import { fetchChildren } from '@ValenceClient/account/fetchChildren';

const CHILDREN = ['children'] as const;

/**
 * The children's accounts this account looks after.
 *
 * @returns The query.
 */
const all = () =>
  queryOptions({
    queryKey: [...CHILDREN, 'all'],
    queryFn: () => fetchChildren(),
  });

const childQueries = { key: CHILDREN, all };

export { childQueries };
