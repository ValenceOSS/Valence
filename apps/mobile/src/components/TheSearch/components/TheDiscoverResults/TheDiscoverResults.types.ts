import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';

type TheDiscoverResultsProps = {
  asked: string;
  onAsk: (about: MediaRequestKind, id: string) => void;
  onBack: () => void;
};

export type { TheDiscoverResultsProps };
