import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { NextEpisodeOffer } from '@ValenceClient/playback/nextEpisodeOfferAt';

type NextEpisodeCardProps = {
  episode: Pick<MediaSummary, 'id' | 'title'> &
    Partial<
      Pick<MediaSummary, 'seasonNumber' | 'episodeNumber' | 'episodeNumberEnd' | 'hasBackdrop'>
    >;
  offer: NextEpisodeOffer;
  isCounting: boolean;
  onPlay: () => void;
  onWatchCredits: () => void;
};

export type { NextEpisodeCardProps };
