import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

type CollectionShelvesProps = {
  progress: ReadonlyMap<string, WatchProgress>;
  onOpen: (media: MediaSummary) => void;
};

export type { CollectionShelvesProps };
