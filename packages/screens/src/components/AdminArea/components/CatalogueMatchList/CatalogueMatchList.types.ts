import type { CatalogueMatch } from '@ValenceClient/admin/fetchAdmin';

type CatalogueMatchListProps = {
  matches: readonly CatalogueMatch[];
  busyId?: string | null;
  onChoose: (match: CatalogueMatch) => void;
};

export type { CatalogueMatchListProps };
