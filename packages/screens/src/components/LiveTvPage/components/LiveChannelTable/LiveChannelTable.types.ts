import type { LiveChannel, LiveProgramme } from '@ValenceContracts/schemas/LiveTv';

type LiveChannelTableProps = {
  channels: readonly LiveChannel[];
  programmes: readonly LiveProgramme[];
  now: number;
  chosenId: string | null;
  onChoose: (channelId: string) => void;
  onToggleFavourite: (channel: LiveChannel) => void;
};

export type { LiveChannelTableProps };
