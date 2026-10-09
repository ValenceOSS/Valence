import type { CatalogueBrowseKind } from '@ValenceContracts/schemas/CatalogueTitle';

type TheDiscoverResultsProps = {
  asked: string;
  onAsk: (about: CatalogueBrowseKind, id: string) => void;
  onBack: () => void;
};

export type { TheDiscoverResultsProps };
