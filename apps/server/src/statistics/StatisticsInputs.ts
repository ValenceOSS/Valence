import type { PlaybackMode } from '@ValenceContracts/functions/describePlaybackMode';

type ViewingRow = {
  mediaItemId: string;
  title: string;
  seriesId: string | null;
  seriesTitle: string | null;
  profileId: string;
  profileName: string | null;
  startedAt: Date;
  secondsWatched: number;
};

type PlayRow = {
  at: Date;
  mode: PlaybackMode;
  reasons: readonly string[];
  client: string | null;
};

export type { PlayRow, ViewingRow };
