import type { CatalogueBrowseKind } from '@ValenceContracts/schemas/CatalogueTitle';

type TheResultsProps = {
  asked: string;
  kind: 'films' | 'shows' | null;
  libraryIds: readonly string[];
  howFarThrough: (mediaId: string) => number;
  onLookAt: (mediaId: string) => void;
  onLookAtShow: (libraryId: string, showId: string) => void;
  onAsk: ((about: CatalogueBrowseKind, id: string) => void) | null;
};

export type { TheResultsProps };
