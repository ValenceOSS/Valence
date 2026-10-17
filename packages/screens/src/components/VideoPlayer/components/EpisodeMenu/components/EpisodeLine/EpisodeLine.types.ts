import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type EpisodeLineProps = {
  episode: MediaSummary;
  isOn: boolean;
  isMoving: boolean;
  isOpen: boolean;
  watchedFraction?: number;
  onPoint: () => void;
  onStopPointing: () => void;
  onOpen: () => void;
  onChoose: () => void;
};

export type { EpisodeLineProps };
