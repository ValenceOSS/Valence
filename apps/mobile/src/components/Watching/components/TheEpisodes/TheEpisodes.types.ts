import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type TheEpisodesProps = {
  seasons: readonly { seasonNumber: number | null; episodes: readonly MediaSummary[] }[];
  playing: string;
  onChoose: (mediaId: string) => void;
  onClose: () => void;
};

export type { TheEpisodesProps };
