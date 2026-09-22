import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type AFeatureProps = {
  media: MediaSummary;
  width: number;
  isShowing: boolean;
  resumeAt: number | null;
  onEnded: () => void;
  onPlay: () => void;
  onMoreInfo: () => void;
};

export type { AFeatureProps };
