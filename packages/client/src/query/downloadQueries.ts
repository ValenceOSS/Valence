import { queryOptions } from '@tanstack/react-query';
import { fetchDownloads, fetchHoldings } from '@ValenceClient/downloads/fetchDownloads';
import { refreshWhilePreparing } from '@ValenceClient/downloads/refreshWhilePreparing';

const DOWNLOADS = ['downloads'] as const;

/**
 * Everything this viewer has asked to have prepared.
 *
 * The server says on the keeping topic whenever one moves on, which is what usually refreshes
 * this. It is also asked again, slowly, while anything is still being prepared, so a socket that
 * dropped cannot leave a bar standing still.
 *
 * @returns The query.
 */
const all = () =>
  queryOptions({
    queryKey: [...DOWNLOADS, 'all'],
    queryFn: () => fetchDownloads(),
    refetchInterval: (query) => refreshWhilePreparing(query.state.data),
  });

/**
 * What this viewer's devices say they are holding.
 *
 * @returns The query.
 */
const holdings = () =>
  queryOptions({
    queryKey: [...DOWNLOADS, 'holdings'],
    queryFn: () => fetchHoldings(),
  });

const downloadQueries = { all, holdings, key: DOWNLOADS };

export { downloadQueries };
