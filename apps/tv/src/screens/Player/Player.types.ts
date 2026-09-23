import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type PlayerProps = {
  mediaId: string;
  startSeconds: number;
  carriedOn: number;
  onLeave: () => void;
  onNext: (episode: MediaSummary, carriedOn: number) => void;
};

export type { PlayerProps };
