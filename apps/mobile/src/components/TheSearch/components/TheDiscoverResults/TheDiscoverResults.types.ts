import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';
import type { CatalogueSearch } from '@ValenceContracts/schemas/CatalogueTitle';

type TheDiscoverResultsProps = {
  asked: string;
  onAsk: (about: MediaRequestKind, id: string) => void;
  onBack: () => void;
  onSeeAll?: (searching: CatalogueSearch, title: string) => void;
};

export type { TheDiscoverResultsProps };
