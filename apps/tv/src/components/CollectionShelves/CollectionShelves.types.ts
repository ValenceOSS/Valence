import type { CollectionEntryKind } from '@ValenceContracts/schemas/Collection';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

type CollectionShelvesProps = {
  holds: CollectionEntryKind;
  progress: ReadonlyMap<string, WatchProgress>;
  onOpen: (media: MediaSummary) => void;
  onFocus?: (media: MediaSummary) => void;
};

export type { CollectionShelvesProps };
