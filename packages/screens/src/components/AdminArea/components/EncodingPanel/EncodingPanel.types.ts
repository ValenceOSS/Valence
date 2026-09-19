import type { Reencode } from '@ValenceContracts/schemas/Reencode';

type EncodingPanelProps = {
  isUnreachable?: boolean;
  reencodes: Reencode[];
  awaitingReviewCap?: number;
  onReview: (reencode: Reencode) => void;
  onStop: (reencode: Reencode) => Promise<boolean>;
  onChoose: () => void;
};

export type { EncodingPanelProps };
