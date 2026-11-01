import type { AMenuItem } from '@ValenceMobile/components/AMenu/AMenu.types';
import type { MusicTrack } from '@ValenceContracts/schemas/Music';

type ATrackRowProps = {
  track: MusicTrack;
  at: number;
  number: number | null;
  artwork: string | null;
  isCurrent: boolean;
  isPlaying?: boolean;
  isLiked: boolean;
  onPlay: (at: number) => void;
  menuOf: (at: number) => readonly AMenuItem[];
  onLike?: (at: number) => void;
};

export type { ATrackRowProps };
