import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type TheFeaturedProps = {
  items: readonly MediaSummary[];
  onLookAt: (mediaId: string) => void;
  onLookAtShow: (libraryId: string, showId: string) => void;
};

export type { TheFeaturedProps };
