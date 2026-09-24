import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type EpisodeRowProps = {
  episode: MediaSummary;
  onPlay: (media: MediaSummary, startSeconds: number) => void;
  onInspect?: (media: MediaSummary) => void;
  onMarkWatched?: (media: MediaSummary, isWatched: boolean) => void;
  watchedFraction?: number;
  resumeSeconds?: number;
  airs?: string;
};

export type { EpisodeRowProps };
