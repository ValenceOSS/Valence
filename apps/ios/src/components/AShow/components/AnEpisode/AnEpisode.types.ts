import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type AnEpisodeProps = {
  episode: MediaSummary;
  watched: number;
  onWatch: () => void;
};

export type { AnEpisodeProps };
