import type { MusicTrack } from '@ValenceContracts/schemas/Music';
import type { QueueSource } from '@ValenceClient/music/playQueue';

type PlayAndShuffleProps = {
  tracks: readonly MusicTrack[];
  source: QueueSource;
  playLabel: string;
  shuffleLabel: string;
  isOrdered?: boolean;
};

export type { PlayAndShuffleProps };
