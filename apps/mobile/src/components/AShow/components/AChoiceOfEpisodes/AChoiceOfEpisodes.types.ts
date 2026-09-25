import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type AChoiceOfEpisodesProps = {
  isOpen: boolean;
  seasons: readonly { seasonNumber: number | null; episodes: readonly MediaSummary[] }[];
  held: ReadonlySet<string>;
  onClose: () => void;
  onChosen: (mediaIds: string[]) => void;
};

export type { AChoiceOfEpisodesProps };
