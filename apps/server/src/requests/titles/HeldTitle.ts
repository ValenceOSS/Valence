import type { CatalogueArt } from '@ValenceContracts/schemas/AdminCatalogue';
import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';

type HeldTitle = {
  kind: MediaRequestKind;
  id: string;
  libraryId: string;
  catalogueId: string | null;
  title: string;
  subtitle: string | null;
  year: number | null;
  art: CatalogueArt | null;
  held: number;
  isAudio: boolean;
  addedAt: string | null;
};

export type { HeldTitle };
