import type { LiveChannel, LiveProgramme } from '@ValenceContracts/schemas/LiveTv';

type LiveGuideGridProps = {
  channels: readonly LiveChannel[];
  programmes: readonly LiveProgramme[];
  from: number;
  until: number;
  now: number;
  chosenId: string | null;
  onChoose: (channelId: string) => void;
  onToggleFavourite: (channel: LiveChannel) => void;
};

export type { LiveGuideGridProps };
