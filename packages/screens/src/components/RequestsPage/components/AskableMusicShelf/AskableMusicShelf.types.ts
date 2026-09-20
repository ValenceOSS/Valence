import type { CatalogueShelf } from '@ValenceContracts/schemas/CatalogueTitle';

type AskableMusicShelfProps = {
  shelf: CatalogueShelf;
  onAsk: (asking: string) => void;
};

export type { AskableMusicShelfProps };
