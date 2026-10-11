import type { LiveChannel, LiveProgramme } from '@ValenceContracts/schemas/LiveTv';

type LivePlayerProps = {
  channel: LiveChannel;
  onNow: LiveProgramme | null;
  upNext: LiveProgramme | null;
  now: number;
  onToggleFavourite: () => void;
  hasProxy?: boolean;
};

export type { LivePlayerProps };
