import type { TitleStatus } from '@ValenceContracts/schemas/AdminCatalogue';

type CatalogueTilesProps = {
  counts: Readonly<Record<TitleStatus, number>>;
  total: number;
  value: TitleStatus | 'all';
  onChange: (status: TitleStatus | 'all') => void;
};

export type { CatalogueTilesProps };
