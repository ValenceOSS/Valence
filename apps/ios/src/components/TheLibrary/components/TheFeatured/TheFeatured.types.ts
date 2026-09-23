import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { VideoPlayer } from 'expo-video';

type TheFeaturedProps = {
  items: readonly MediaSummary[];
  onWatch: (mediaId: string, startSeconds: number) => void;
  onLookAt: (mediaId: string) => void;
  onLookAtShow: (libraryId: string, showId: string) => void;
  onShowing?: (media: MediaSummary | null) => void;
  onClip?: (player: VideoPlayer | null) => void;
};

export type { TheFeaturedProps };
