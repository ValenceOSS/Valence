import type { laySeasonsOut } from '@ValenceClient/library/laySeasonsOut';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type AnEpisodeListProps = {
  rows: ReturnType<typeof laySeasonsOut>['rows'];
  watchedOf: (mediaId: string) => number;
  resumeOf: (mediaId: string) => number | null;
  onWatch: (mediaId: string, startSeconds: number) => void;
  onLookAt: (mediaId: string) => void;
  onMarkWatched: (episode: MediaSummary, isWatched: boolean) => void;
};

export type { AnEpisodeListProps };
