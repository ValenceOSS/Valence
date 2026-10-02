import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

type FavouritesShelfProps = {
  viewerId: string | null;
  watchable: readonly string[];
  progress: ReadonlyMap<string, WatchProgress>;
  onOpen: (media: MediaSummary) => void;
};

export type { FavouritesShelfProps };
