import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type MediaFactsProps = {
  media: MediaSummary;
  size?: 'inherit' | 'xs' | 'sm' | 'base';
  tone?: 'inherit' | 'muted' | 'scrim';
  hasRuntime?: boolean;
  hasEpisode?: boolean;
  hasSize?: boolean;
};

export type { MediaFactsProps };
