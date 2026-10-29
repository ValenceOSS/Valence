import type { ShareRow } from '@ValenceMetrics/stats/MetricsStats';

type ShareCardProps = {
  title: string;
  heading: string;
  rows: readonly ShareRow[];
  note?: string;
};

export type { ShareCardProps };
