import type { CatalogueBrowseKind } from '@ValenceContracts/schemas/CatalogueTitle';

type TheSearchProps = {
  onLookAt: (mediaId: string) => void;
  onLookAtShow: (libraryId: string, showId: string) => void;
  onAsk: ((about: CatalogueBrowseKind, id: string) => void) | null;
};

export type { TheSearchProps };
