import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type TheFeaturedProps = {
  items: readonly MediaSummary[];
  onWatch: (mediaId: string, startSeconds: number) => void;
  onLookAt: (mediaId: string) => void;
  onLookAtShow: (libraryId: string, showId: string) => void;
};

export type { TheFeaturedProps };
