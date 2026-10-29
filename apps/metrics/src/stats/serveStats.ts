import { readDownloads } from '@ValenceMetrics/downloads/readDownloads';
import { readCachedStats } from './readCachedStats';

/**
 * Answers with every figure the page shows, as JSON for anybody who would rather read them
 * themselves, for caches to keep for five minutes.
 *
 * @returns The figures and the download counts.
 */
const serveStats = async (): Promise<Response> => {
  const [stats, downloads] = await Promise.all([readCachedStats(), readDownloads()]);

  return Response.json(
    { ...stats, downloads },
    { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=60' } },
  );
};

export { serveStats };
