import type { StreamOffers } from '@ValenceContracts/schemas/StreamOffer';

type AChooseSourceSheetProps = {
  title: string;
  isOpen: boolean;
  offers: StreamOffers | undefined;
  isLooking: boolean;
  isFailed: boolean;
  bestId: string | null;
  isPlaying: boolean;
  onTryAgain: () => void;
  onChoose: (offerId: string) => void;
  onClose: () => void;
};

export type { AChooseSourceSheetProps };
