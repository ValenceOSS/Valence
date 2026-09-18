import type { MusicTrack } from '@ValenceContracts/schemas/Music';

type TrackMenuProps = {
  track: MusicTrack;
  onRemove?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  className?: string;
};

export type { TrackMenuProps };
