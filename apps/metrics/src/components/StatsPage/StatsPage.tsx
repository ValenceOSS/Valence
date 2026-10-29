import { connection } from 'next/server';
import { StatsDashboard } from '@ValenceMetrics/components/StatsDashboard/StatsDashboard';
import { readDownloads } from '@ValenceMetrics/downloads/readDownloads';
import { readCachedStats } from '@ValenceMetrics/stats/readCachedStats';

/**
 * Reads the figures and the download counts as each visitor asks for the page, rather than once
 * when the site is built, and lays them out.
 */
const StatsPage = async () => {
  await connection();

  const [stats, downloads] = await Promise.all([readCachedStats(), readDownloads()]);

  return <StatsDashboard stats={stats} downloads={downloads} />;
};

StatsPage.displayName = 'StatsPage';

export { StatsPage };
