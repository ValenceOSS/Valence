import type { MusicTrack } from '@ValenceContracts/schemas/Music';

type TrackRowProps = {
  track: MusicTrack;
  place: number;
  isCurrent: boolean;
  isPlaying: boolean;
  showsAlbum?: boolean;
  onPress: (place: number) => void;
  onFocus?: (place: number) => void;
};

export type { TrackRowProps };
