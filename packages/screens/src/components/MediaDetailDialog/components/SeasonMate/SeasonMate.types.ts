import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type SeasonMateProps = {
  episode: MediaSummary;
  watched?: number | undefined;
  onSelect: () => void;
};

export type { SeasonMateProps };
