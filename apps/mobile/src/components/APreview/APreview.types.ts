import type { VideoPlayer, VideoSource } from 'expo-video';

type AClipPlayer = {
  player: VideoPlayer;
  source: VideoSource | null;
  load: (source: VideoSource) => void;
  letGo: (source: VideoSource) => void;
};

type APreviewProps = ({ mediaId: string; hasBackdrop: boolean } | { clip: string }) & {
  isShowing: boolean;
  isMuted: boolean;
  clipPlayer?: AClipPlayer | null;
  onEnded?: () => void;
  onPlaying?: (isPlaying: boolean) => void;
  onClip?: (player: VideoPlayer | null) => void;
  onFinding?: (finding: 'finding' | 'found' | 'none') => void;
};

export type { AClipPlayer, APreviewProps };
