import { queryOptions } from '@tanstack/react-query';
import { fetchDownloads, fetchHoldings } from '@ValenceClient/downloads/fetchDownloads';

const DOWNLOADS = ['downloads'] as const;

/**
 * Everything this viewer has asked to have prepared.
 *
 * Not polled. The server follows each file being prepared and says on the keeping topic whenever
 * one moves on, which is what refreshes this.
 *
 * @returns The query.
 */
const all = () =>
  queryOptions({
    queryKey: [...DOWNLOADS, 'all'],
    queryFn: () => fetchDownloads(),
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
