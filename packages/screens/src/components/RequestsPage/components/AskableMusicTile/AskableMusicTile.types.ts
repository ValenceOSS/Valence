import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';

type AskableMusicTileProps = {
  title: CatalogueTitle;
  onAsk: (asking: string) => void;
};

export type { AskableMusicTileProps };
