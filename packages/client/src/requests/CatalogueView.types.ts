import type { CatalogueTab, TitleStatus } from '@ValenceContracts/schemas/AdminCatalogue';

type CatalogueKind = 'all' | 'artist' | 'album' | 'ebook' | 'audiobook';

type CatalogueSort = 'recent' | 'title';

type CatalogueView = {
  tab: CatalogueTab;
  status: TitleStatus | 'all';
  kind: CatalogueKind;
  query: string;
  sort: CatalogueSort;
};

export type { CatalogueKind, CatalogueSort, CatalogueView };
