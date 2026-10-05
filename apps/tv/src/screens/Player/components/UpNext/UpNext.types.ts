import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { NextEpisodeOffer } from '@ValenceClient/playback/nextEpisodeOfferAt';

type UpNextProps = {
  episode: MediaSummary;
  isAsking: boolean;
  offer: NextEpisodeOffer | null;
  onPlay: () => void;
  onStay: () => void;
};

export type { UpNextProps };
