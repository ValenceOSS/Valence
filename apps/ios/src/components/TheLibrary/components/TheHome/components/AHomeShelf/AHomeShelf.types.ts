import type { Rail } from '@ValenceClient/library/groupIntoRails';
import type { ComingUp } from '@ValenceContracts/schemas/Show';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

type AShelfOf = { kind: 'rail'; rail: Rail } | { kind: 'comingUp' };

type AHomeShelfProps = {
  shelf: AShelfOf;
  upcoming: ComingUp['shows'];
  progress: Map<string, WatchProgress>;
  today: string;
  onLookAt: (mediaId: string) => void;
  onLookAtShow: (libraryId: string, showId: string) => void;
};

export type { AHomeShelfProps, AShelfOf };
