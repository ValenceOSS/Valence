import type { PlaybackMode } from '@ValenceContracts/functions/describePlaybackMode';
import type { Statistics, StatisticsRange } from '@ValenceContracts/schemas/Statistics';

type PlayToRecord = {
  profileId: string | null;
  mediaItemId: string;
  mode: PlaybackMode;
  reasons: readonly string[];
  client: string | null;
};

type StatisticsService = {
  recordPlay: (play: PlayToRecord) => Promise<void>;
  read: (range: StatisticsRange, zone: string) => Promise<Statistics>;
};

export type { PlayToRecord, StatisticsService };
