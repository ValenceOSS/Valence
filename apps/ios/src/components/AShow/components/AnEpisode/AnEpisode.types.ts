import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type AnEpisodeProps = {
  episode: MediaSummary;
  watched: number;
  airs: string;
  onWatch: () => void;
  onLookAt: () => void;
};

export type { AnEpisodeProps };
