import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type MediaPanelProps = {
  isUnreachable?: boolean;
  media: MediaSummary[];
  onCorrect: (media: MediaSummary) => void;
  onChooseMoment: (media: MediaSummary) => void;
  onRebuildArtefacts: (media: MediaSummary) => Promise<boolean>;
  onReencode?: (media: MediaSummary) => void;
};

export type { MediaPanelProps };
