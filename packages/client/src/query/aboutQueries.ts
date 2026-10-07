import { queryOptions } from '@tanstack/react-query';
import { aboutKeptFor } from '@ValenceClient/about/aboutKeptFor';
import { fetchServerBuildInfo } from '@ValenceClient/about/fetchServerBuildInfo';

const ABOUT = ['about'] as const;

/**
 * What the server is running, kept as long as `aboutKeptFor` says.
 *
 * @returns The query.
 */
const server = () =>
  queryOptions({
    queryKey: [...ABOUT, 'server'],
    queryFn: () => fetchServerBuildInfo(),
    staleTime: (query) => aboutKeptFor(query.state.data),
    retry: false,
  });

const aboutQueries = { server, key: ABOUT };

export { aboutQueries };
