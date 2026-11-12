import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type PausedMedia = Pick<MediaSummary, 'id' | 'title'> &
  Partial<Pick<MediaSummary, 'seriesTitle' | 'seasonNumber' | 'episodeNumber' | 'hasLogo'>>;

type StillWatchingAsk = {
  upNext: PausedMedia;
  onCarryOn: () => void;
  onStop: () => void;
};

type PausedScreenProps = {
  media: PausedMedia;
  isShown: boolean;
  asking?: StillWatchingAsk;
};

export type { PausedMedia, PausedScreenProps, StillWatchingAsk };
