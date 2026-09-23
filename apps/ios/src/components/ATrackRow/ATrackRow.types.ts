import type { MusicTrack } from '@ValenceContracts/schemas/Music';

type ATrackRowProps = {
  track: MusicTrack;
  number: number | null;
  artwork: string | null;
  isCurrent: boolean;
  isLiked: boolean;
  onPlay: () => void;
  onMenu: () => void;
};

export type { ATrackRowProps };
