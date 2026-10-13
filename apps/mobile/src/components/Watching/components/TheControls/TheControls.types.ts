import type { Animated } from 'react-native';
import type { Trickplay } from '@ValenceClient/playback/fetchTrickplay';

type TheControlsProps = {
  fade: Animated.Value;
  title: string;
  year: number | null;
  isPlaying: boolean;
  at: number;
  runsFor: number;
  buffered: number;
  trickplay: Trickplay | null;
  rate: number;
  qualityLabel: string;
  onPlayPause: () => void;
  onSkip: (by: number) => void;
  onSeek: (to: number) => void;
  onTouched: () => void;
  onClose: () => void;
  onLock: () => void;
  onPictureInPicture: () => void;
  onSpeed: () => void;
  onAudioAndSubtitles: () => void;
  onQuality?: (() => void) | undefined;
  onStats: () => void;
  onEpisodes?: (() => void) | undefined;
  onNext?: (() => void) | undefined;
  onParty?: (() => void) | undefined;
};

export type { TheControlsProps };
