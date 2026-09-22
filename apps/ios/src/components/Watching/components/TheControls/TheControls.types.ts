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
  onPlayPause: () => void;
  onSkip: (by: number) => void;
  onSeek: (to: number) => void;
  onTouched: () => void;
  onClose: () => void;
  onSettings: () => void;
};

export type { TheControlsProps };
