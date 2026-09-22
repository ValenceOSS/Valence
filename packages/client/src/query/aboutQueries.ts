import { queryOptions } from '@tanstack/react-query';
import { fetchServerBuildInfo } from '@ValenceClient/about/fetchServerBuildInfo';

const ABOUT = ['about'] as const;

/**
 * What the server is running, kept for a while since it cannot change under a process that is
 * already up.
 *
 * @returns The query.
 */
const server = () =>
  queryOptions({
    queryKey: [...ABOUT, 'server'],
    queryFn: () => fetchServerBuildInfo(),
    staleTime: Infinity,
    retry: false,
  });

const aboutQueries = { server, key: ABOUT };

export { aboutQueries };
