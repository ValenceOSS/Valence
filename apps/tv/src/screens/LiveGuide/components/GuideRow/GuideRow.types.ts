import type { LiveChannel, LiveProgramme } from '@ValenceContracts/schemas/LiveTv';
import type { GuideCell } from '@ValenceClient/live/guideCellsOf';

type GuideRowProps = {
  channel: LiveChannel;
  programmes: readonly LiveProgramme[];
  from: number;
  until: number;
  width: number;
  now: number;
  aimAt: number | null;
  onAimed: () => void;
  onWatch: (channel: LiveChannel) => void;
  onKeep: (channel: LiveChannel) => void;
  onLand: (channel: LiveChannel, cell: GuideCell) => void;
  onLeave: (channel: LiveChannel, cell: GuideCell) => void;
};

export type { GuideRowProps };
