import type { CatalogueBrowseKind } from '@ValenceContracts/schemas/CatalogueTitle';

type TheLibraryProps = {
  onLookAt: (mediaId: string) => void;
  onLookAtShow: (libraryId: string, showId: string) => void;
  onAsk: ((about: CatalogueBrowseKind, id: string) => void) | null;
};

export type { TheLibraryProps };
