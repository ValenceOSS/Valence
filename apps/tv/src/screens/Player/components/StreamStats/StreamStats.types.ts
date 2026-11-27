import type { StreamReading, StreamStatsInput } from '@ValenceClient/playback/describeStreamStats';

type StreamStatsProps = StreamStatsInput & {
  history: readonly StreamReading[];
};

export type { StreamStatsProps };
