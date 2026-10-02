import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type FilmPageProps = {
  mediaId: string;
  viewerId: string;
  onPlay: (media: MediaSummary, startSeconds: number) => void;
  onOpenPerson: (personId: number) => void;
};

export type { FilmPageProps };
