import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type LikeThisShelfProps = {
  mediaId: string | null;
  onPlay: (media: MediaSummary, startSeconds: number) => void;
  onInspect: (media: MediaSummary) => void;
  onOpenShow: (media: MediaSummary) => void;
};

export type { LikeThisShelfProps };
