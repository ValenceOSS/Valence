import type { Freshness } from '@ValenceClient/query/Freshness';
import type { Reencode } from '@ValenceContracts/schemas/Reencode';

type EncodingPanelProps = {
  isUnreachable?: boolean;
  isReading?: boolean;
  freshness?: Freshness;
  reencodes: Reencode[];
  awaitingReviewCap?: number;
  onReview: (reencode: Reencode) => void;
  onConfirmAll?: (ids: string[]) => Promise<void>;
  onStop: (reencode: Reencode) => Promise<boolean>;
  onChoose: () => void;
};

export type { EncodingPanelProps };
