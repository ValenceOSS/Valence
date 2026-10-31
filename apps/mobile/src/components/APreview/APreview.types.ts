import type { VideoPlayer } from 'expo-video';

type APreviewProps = ({ mediaId: string; hasBackdrop: boolean } | { clip: string }) & {
  isShowing: boolean;
  isMuted: boolean;
  onEnded?: () => void;
  onPlaying?: (isPlaying: boolean) => void;
  onClip?: (player: VideoPlayer | null) => void;
};

export type { APreviewProps };
