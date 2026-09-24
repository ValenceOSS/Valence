import type { MusicTrack } from '@ValenceContracts/schemas/Music';

type ATrackRowProps = {
  track: MusicTrack;
  at: number;
  number: number | null;
  artwork: string | null;
  isCurrent: boolean;
  isLiked: boolean;
  onPlay: (at: number) => void;
  onMenu: (at: number) => void;
};

export type { ATrackRowProps };
