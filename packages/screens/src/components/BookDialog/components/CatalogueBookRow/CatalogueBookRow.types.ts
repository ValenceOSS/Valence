import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';

type CatalogueBookRowProps = {
  heading: string;
  titles: readonly CatalogueTitle[];
  isByOthers?: boolean;
  onOpenBook: (bookId: string) => void;
  onAsk?: (asking: string) => void;
};

export type { CatalogueBookRowProps };
