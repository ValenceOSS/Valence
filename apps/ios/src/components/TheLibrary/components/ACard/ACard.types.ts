import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type ACardProps = {
  media: MediaSummary;
  asProgramme: boolean;
  watched?: number;
  onLookAt: (mediaId: string) => void;
  onLookAtShow: (libraryId: string, showId: string) => void;
};

export type { ACardProps };
