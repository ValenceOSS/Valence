import type { Release, ReleaseSearchOutcome } from '@ValenceContracts/schemas/Indexer';
import type { ReleaseKind } from '@ValenceClient/requests/qualityOfReleaseTitle';
import type { Narration } from '@ValenceContracts/schemas/MediaRequest';

type ReleasePickTableProps = {
  found: ReleaseSearchOutcome;
  foundAt: number;
  pickingId: string | null;
  emptyMessage: string;
  kind?: ReleaseKind;
  narrations?: readonly Narration[];
  isHereAlready?: boolean;
  onPick: (release: Release, keepsBoth: boolean) => void;
};

export type { ReleasePickTableProps };
