import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { Rail } from '@ValenceClient/library/groupIntoRails';
import type { ComingUp } from '@ValenceContracts/schemas/Show';
import type { Collection } from '@ValenceContracts/schemas/Collection';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

type AShelfOf = { kind: 'rail'; rail: Rail } | { kind: 'comingUp' } | { kind: 'collections' };

type AHomeShelfProps = {
  shelf: AShelfOf;
  upcoming: ComingUp['shows'];
  collections: readonly Collection[];
  progress: Map<string, WatchProgress>;
  today: string;
  onLookAt: (mediaId: string) => void;
  onLookAtShow: (libraryId: string, showId: string) => void;
  onLookAtCollection: (collectionId: string) => void;
  flagOf: (media: MediaSummary) => string | null;
};

export type { AHomeShelfProps, AShelfOf };
