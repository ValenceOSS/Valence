import type { Animated } from 'react-native';
import type { Trickplay } from '@ValenceClient/playback/fetchTrickplay';
import type { MediaSegment } from '@ValenceContracts/schemas/MediaSegment';
import type { VideoChapter } from '@ValenceContracts/schemas/VideoChapter';

type TheControlsProps = {
  fade: Animated.Value;
  title: string;
  year: number | null;
  rating?: { certification: string; region: string } | null;
  isPlaying: boolean;
  wait?: { isShown: boolean; isFinishing: boolean; onFilled: () => void } | undefined;
  at: number;
  runsFor: number;
  buffered: number;
  trickplay: Trickplay | null;
  segments?: readonly MediaSegment[];
  chapters?: readonly VideoChapter[];
  onPlayPause: () => void;
  onSkip: (by: number) => void;
  onSeek: (to: number) => void;
  onTouched: () => void;
  onClose: () => void;
  onLock: () => void;
  onPictureInPicture: () => void;
  onSettings: () => void;
  onStats: () => void;
  onEpisodes?: (() => void) | undefined;
  onNext?: (() => void) | undefined;
  onParty?: (() => void) | undefined;
};

export type { TheControlsProps };
