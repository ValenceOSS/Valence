import type { StreamOffers } from '@ValenceContracts/schemas/StreamOffer';

type ChooseSourceDialogProps = {
  title: string;
  isOpen: boolean;
  offers: StreamOffers | undefined;
  isLooking: boolean;
  isFailed: boolean;
  bestId: string | null;
  isPlaying: boolean;
  problem: string | null;
  onTryAgain: () => void;
  onChoose: (offerId: string) => void;
  onClose: () => void;
};

export type { ChooseSourceDialogProps };
