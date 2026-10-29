import type { Downloads } from '@ValenceMetrics/downloads/Downloads';
import type { MetricsStats } from '@ValenceMetrics/stats/MetricsStats';

type StatsDashboardProps = {
  stats: MetricsStats;
  downloads: Downloads;
};

export type { StatsDashboardProps };
