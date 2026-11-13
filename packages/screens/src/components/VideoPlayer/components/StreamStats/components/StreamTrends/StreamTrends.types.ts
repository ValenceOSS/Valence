import type { StatsReading } from '@ValenceScreens/components/VideoPlayer/components/StreamStats/StreamStats.types';

type StreamTrendsProps = {
  history: readonly StatsReading[];
  fileBitrateKbps?: number | null;
};

export type { StreamTrendsProps };
