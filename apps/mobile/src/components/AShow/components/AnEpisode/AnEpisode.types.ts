import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type AnEpisodeProps = {
  episode: MediaSummary;
  watched: number;
  resumeSeconds: number | null;
  airs: string;
  onWatch: (mediaId: string, startSeconds: number) => void;
  onLookAt: (mediaId: string) => void;
  onMarkWatched?: (episode: MediaSummary, isWatched: boolean) => void;
};

export type { AnEpisodeProps };
