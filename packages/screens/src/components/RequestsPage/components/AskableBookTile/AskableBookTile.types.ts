import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';

type AskableBookTileProps = {
  title: CatalogueTitle;
  onAsk: (asking: string) => void;
};

export type { AskableBookTileProps };
