import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type ACardProps = {
  media: MediaSummary;
  asProgramme: boolean;
  watched?: number;
  count?: number;
  wide?: number;
  isStill?: boolean;
  look?: 'poster' | 'art';
  flag?: string | null;
  onLookAt: (mediaId: string) => void;
  onLookAtShow: (libraryId: string, showId: string) => void;
};

export type { ACardProps };
