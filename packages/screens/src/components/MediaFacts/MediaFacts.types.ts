import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type MediaFactsProps = {
  media: MediaSummary;
  className?: string;
  hasRuntime?: boolean;
  hasEpisode?: boolean;
  hasSize?: boolean;
};

export type { MediaFactsProps };
