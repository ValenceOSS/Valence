import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type SeasonMateProps = {
  episode: MediaSummary;
  watched?: number | undefined;
  namesItsShow?: boolean;
  onSelect: () => void;
};

export type { SeasonMateProps };
