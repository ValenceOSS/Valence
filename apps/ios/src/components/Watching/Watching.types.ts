import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type WatchingProps = {
  mediaId: string;
  startSeconds?: number;
  onDone: () => void;
  onEnded?: () => void;
  seasons?: readonly { seasonNumber: number | null; episodes: readonly MediaSummary[] }[];
  onChooseEpisode?: (mediaId: string) => void;
};

export type { WatchingProps };
