import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { Animated } from 'react-native';
import type { VideoPlayer } from 'expo-video';
import type { AClipPlayer } from '@ValenceMobile/components/APreview/APreview.types';

type AFeatureProps = {
  media: MediaSummary;
  width: number;
  height: number;
  isShowing: boolean;
  clipPlayer: AClipPlayer | null;
  resumeAt: number | null;
  onEnded: () => void;
  onPlay: () => void;
  onMoreInfo: () => void;
  onClip?: (player: VideoPlayer | null) => void;
  nearness?: Animated.AnimatedInterpolation<number>;
};

export type { AFeatureProps };
