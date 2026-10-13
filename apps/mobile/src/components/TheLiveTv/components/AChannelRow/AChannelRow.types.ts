import type { LiveChannel, LiveProgramme } from '@ValenceContracts/schemas/LiveTv';

type AChannelRowProps = {
  channel: LiveChannel;
  onNow: LiveProgramme | null;
  upNext: LiveProgramme | null;
  now: number;
  onWatch: () => void;
  onToggleFavourite: () => void;
};

export type { AChannelRowProps };
