import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type UpNextProps = {
  episode: MediaSummary;
  isAsking: boolean;
  onPlay: () => void;
  onStay: () => void;
};

export type { UpNextProps };
