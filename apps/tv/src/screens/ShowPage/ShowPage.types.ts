import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type ShowPageProps = {
  libraryId: string;
  showId: string;
  viewerId: string | null;
  onPlay: (episode: MediaSummary, startSeconds: number) => void;
};

export type { ShowPageProps };
