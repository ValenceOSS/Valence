import type { UpTarget } from '@ValenceTv/components/SystemSearch/SystemSearch.types';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type SearchProps = {
  watchable: readonly string[];
  onOpen: (media: MediaSummary) => void;
  onAsk: (title: CatalogueTitle) => void;
  onFeature: (path: string | null) => void;
  upTo: UpTarget;
};

export type { SearchProps };
