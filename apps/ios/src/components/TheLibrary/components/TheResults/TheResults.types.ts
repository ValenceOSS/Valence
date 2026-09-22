import type { CatalogueBrowseKind } from '@ValenceContracts/schemas/CatalogueTitle';

type TheResultsProps = {
  asked: string;
  libraryIds: readonly string[];
  howFarThrough: (mediaId: string) => number;
  onLookAt: (mediaId: string) => void;
  onLookAtShow: (libraryId: string, showId: string) => void;
  onAsk: ((about: CatalogueBrowseKind, id: string) => void) | null;
};

export type { TheResultsProps };
