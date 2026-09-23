import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { VideoPlayer } from 'expo-video';

type AFeatureProps = {
  media: MediaSummary;
  width: number;
  isShowing: boolean;
  resumeAt: number | null;
  onEnded: () => void;
  onPlay: () => void;
  onMoreInfo: () => void;
  onClip?: (player: VideoPlayer | null) => void;
};

export type { AFeatureProps };
