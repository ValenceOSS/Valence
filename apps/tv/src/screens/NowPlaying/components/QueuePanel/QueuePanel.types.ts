import type { MusicTrack } from '@ValenceContracts/schemas/Music';

type QueuePanelProps = {
  upcoming: readonly { at: number; track: MusicTrack }[];
  picks: readonly string[];
  onJump: (at: number) => void;
};

export type { QueuePanelProps };
