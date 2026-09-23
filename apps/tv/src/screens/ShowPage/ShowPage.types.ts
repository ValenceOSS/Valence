import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type ShowPageProps = {
  libraryId: string;
  showId: string;
  onPlay: (episode: MediaSummary, startSeconds: number) => void;
};

export type { ShowPageProps };
