import type { MusicTrack } from '@ValenceContracts/schemas/Music';

type QueuePanelProps = {
  upcoming: readonly { at: number; track: MusicTrack }[];
  onJump: (at: number) => void;
};

export type { QueuePanelProps };
