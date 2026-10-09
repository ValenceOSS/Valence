import type { CatalogueTab } from '@ValenceContracts/schemas/AdminCatalogue';

type CataloguePanelProps = {
  tab: CatalogueTab;
  title: string | null;
  onTab: (tab: CatalogueTab) => void;
  onOpen: (key: string | null) => void;
  onOpenFolder?: (path: string) => void;
};

export type { CataloguePanelProps };
