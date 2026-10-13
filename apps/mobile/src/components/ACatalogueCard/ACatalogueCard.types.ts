import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';

type ACatalogueCardProps = {
  title: CatalogueTitle;
  onAsk: (kind: MediaRequestKind, id: string) => void;
  wide?: number;
};

export type { ACatalogueCardProps };
