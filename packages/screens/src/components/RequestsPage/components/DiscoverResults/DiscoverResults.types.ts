import type { CatalogueSearch } from '@ValenceContracts/schemas/CatalogueTitle';

type DiscoverResultsProps = {
  query: string;
  onAsk: (asking: string) => void;
  onSeeAll?: (searching: CatalogueSearch) => void;
};

export type { DiscoverResultsProps };
