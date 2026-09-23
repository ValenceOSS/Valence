import type { UpTarget } from '@ValenceTv/components/SystemSearch/SystemSearch.types';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { MusicItem } from '@ValenceTv/music/MusicItem';

type SearchProps = {
  watchable: readonly string[];
  onOpen: (media: MediaSummary) => void;
  onAsk: (title: CatalogueTitle) => void;
  onFeature: (path: string | null) => void;
  upTo: UpTarget;
  hasMusic: boolean;
  onOpenMusic: (item: MusicItem) => void;
  onPlayedMusic: () => void;
};

export type { SearchProps };
