import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type TheFeaturedProps = {
  items: readonly MediaSummary[];
  onWatch: (mediaId: string, startSeconds: number) => void;
  onLookAt: (mediaId: string) => void;
  onLookAtShow: (libraryId: string, showId: string) => void;
  onShowing?: (media: MediaSummary | null) => void;
  isInView?: boolean;
};

export type { TheFeaturedProps };
