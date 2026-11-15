import type { VideoPlayer } from 'expo-video';
import type { ClipFraming } from '@ValenceClient/playback/ClipFraming';

type AClipProps = {
  player: VideoPlayer;
  isShowing: boolean;
  isOnTop: boolean;
  isMuted: boolean;
  framing: ClipFraming | null;
  held: { wide: number; high: number } | null;
  onEnded?: () => void;
  onPlaying: (isPlaying: boolean) => void;
  onClip?: (player: VideoPlayer | null) => void;
};

export type { AClipProps };
