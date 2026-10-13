import type { StreamStatsGroup } from '@ValenceClient/playback/describeStreamStats';

type TheStatsProps = {
  groups: readonly StreamStatsGroup[];
  onClose: () => void;
};

export type { TheStatsProps };
