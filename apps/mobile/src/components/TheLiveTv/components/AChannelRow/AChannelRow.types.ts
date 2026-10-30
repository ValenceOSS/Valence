import type { LiveChannel, LiveProgramme } from '@ValenceContracts/schemas/LiveTv';

type AChannelRowProps = {
  channel: LiveChannel;
  onNow: LiveProgramme | null;
  upNext: LiveProgramme | null;
  now: number;
  onWatch: (channelId: string) => void;
  onToggleFavourite: (channel: LiveChannel) => void;
};

export type { AChannelRowProps };
