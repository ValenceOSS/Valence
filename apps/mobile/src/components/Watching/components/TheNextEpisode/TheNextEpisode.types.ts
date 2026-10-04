import type { NextEpisodeOffer } from '@ValenceClient/playback/nextEpisodeOfferAt';

type TheNextEpisodeProps = {
  offer: NextEpisodeOffer;
  isCounting: boolean;
  onPlay: () => void;
  onWatchCredits: () => void;
};

export type { TheNextEpisodeProps };
