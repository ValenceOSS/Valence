import type { LiveChannel, LiveProgramme } from '@ValenceContracts/schemas/LiveTv';

type ALivePlayerProps = {
  channel: LiveChannel;
  onNow: LiveProgramme | null;
  upNext: LiveProgramme | null;
  now: number;
  onPrevious?: (() => void) | undefined;
  onNext?: (() => void) | undefined;
  onToggleFavourite: () => void;
  onClose: () => void;
};

export type { ALivePlayerProps };
