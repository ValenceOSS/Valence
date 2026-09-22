import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type MediaCardShape = 'wide' | 'poster';

type MediaCardProps = {
  media: MediaSummary;
  onPress: (media: MediaSummary) => void;
  shape?: MediaCardShape;
  watchedFraction?: number;
  isEpisode?: boolean;
  hasPreferredFocus?: boolean;
  onFocus?: (media: MediaSummary) => void;
};

export type { MediaCardProps, MediaCardShape };
