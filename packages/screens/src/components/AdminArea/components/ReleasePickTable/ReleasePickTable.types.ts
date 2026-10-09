import type { Release, ReleaseSearchOutcome } from '@ValenceContracts/schemas/Indexer';
import type { ReleaseKind } from '@ValenceClient/requests/qualityOfReleaseTitle';

type ReleasePickTableProps = {
  found: ReleaseSearchOutcome;
  foundAt: number;
  pickingId: string | null;
  emptyMessage: string;
  kind?: ReleaseKind;
  isHereAlready?: boolean;
  onPick: (release: Release, keepsBoth: boolean) => void;
};

export type { ReleasePickTableProps };
