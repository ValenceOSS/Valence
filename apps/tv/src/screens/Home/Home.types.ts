import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type HomeProps = {
  viewerId: string;
  watchable: readonly string[];
  onOpen: (media: MediaSummary) => void;
  onPlay: (media: MediaSummary, startSeconds: number) => void;
  isCovered: boolean;
  onFeature: (media: MediaSummary) => void;
};

export type { HomeProps };
