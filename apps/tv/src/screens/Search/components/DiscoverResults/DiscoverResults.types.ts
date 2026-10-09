import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';

type DiscoverResultsProps = {
  asked: string;
  films: readonly CatalogueTitle[];
  shows: readonly CatalogueTitle[];
  onAsk: (title: CatalogueTitle) => void;
  onBack: () => void;
};

export type { DiscoverResultsProps };
