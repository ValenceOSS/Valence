import type { ReactNode } from 'react';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { VideoPlayer } from 'expo-video';

type TheHomeProps = {
  header: ReactNode;
  watchable: readonly string[];
  onWatch: (mediaId: string, startSeconds: number) => void;
  onLookAt: (mediaId: string) => void;
  onLookAtShow: (libraryId: string, showId: string) => void;
  onShowing: (media: MediaSummary | null) => void;
  onClip: (player: VideoPlayer | null) => void;
};

export type { TheHomeProps };
