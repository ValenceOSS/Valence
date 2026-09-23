import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type EpisodeCardProps = {
  episode: MediaSummary;
  overview?: string | null;
  watchedFraction?: number;
  isWatched?: boolean;
  onPress: (episode: MediaSummary) => void;
};

export type { EpisodeCardProps };
